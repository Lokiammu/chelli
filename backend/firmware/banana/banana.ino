#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <math.h>

// ---------------- CONFIG ----------------
const char* ssid     = "Airtel_Sim";
const char* password = "Bala2001@";
const char* backendHost = "192.168.1.6"; // <-- backend PC IP
const int backendPort = 3000;
const char* backendPath = "/updateFreshness";

// Pins
const int MQ_PIN = A0;
const int LED_PIN = D2;
const int DHT_PIN = D5; // DHT11 data pin
#define DHTTYPE DHT11  // ✅ changed for DHT11

// DHT object
DHT dht(DHT_PIN, DHTTYPE);

// ADC & sensor parameters
const float RL_VALUE = 10.0; // kΩ
const float R0 = 10.0;
const float ADC_MAX = 1023.0;
const float VREF = 1.0;

// Example curve constants for MQ135
const float a_curve = 110.47;
const float b_curve = -2.862;

const int PRODUCT_ID = 1;
unsigned long lastSense = 0;
const unsigned long senseInterval = 15000; // 15 s

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  connectWiFi();
  dht.begin();
}

void loop() {
  if (millis() - lastSense >= senseInterval) {
    lastSense = millis();
    digitalWrite(LED_PIN, HIGH);

    float voc = senseVOC();
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("Failed to read from DHT11!");
      temperature = 0;
      humidity = 0;
    }

    String stage = mapStage(voc);
    Serial.printf("VOC: %.2f ppm | Temp: %.2f°C | Hum: %.2f%% | Stage: %s\n",
                  voc, temperature, humidity, stage.c_str());

    sendToBackend(PRODUCT_ID, voc, temperature, humidity);

    digitalWrite(LED_PIN, LOW);
  }
  delay(200);
}

// ---------- FUNCTIONS ----------

void connectWiFi() {
  Serial.printf("Connecting to %s", ssid);
  WiFi.begin(ssid, password);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 40) {
    delay(500);
    Serial.print(".");
    tries++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  else
    Serial.println("WiFi connection failed!");
}

float senseVOC() {
  float total = 0;
  for (int i = 0; i < 5; i++) {
    total += analogRead(MQ_PIN);
    delay(100);
  }
  int raw = total / 5;
  float vOut = (raw / ADC_MAX) * VREF;
  if (vOut < 0.01f) vOut = 0.01f;
  float rs = ((VREF - vOut) * RL_VALUE) / vOut;
  float ratio = rs / R0;
  float ppm = a_curve * pow(ratio, b_curve);
  return ppm < 0 ? 0 : ppm;
}


String mapStage(float ppm) {
  if (ppm < 0.15) return "Fresh";
  else if (ppm < 0.5) return "Ripening";
  else return "spoiled";
}

void sendToBackend(int productId, float voc, float temp, float hum) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return;
  }
  WiFiClient client;
  HTTPClient http;
  String url = String("http://") + backendHost + ":" + backendPort + backendPath;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["productId"] = productId;
  doc["voc"] = voc;
  doc["temperature"] = temp;
  doc["humidity"] = hum;

  String payload;
  serializeJson(doc, payload);
  int code = http.POST(payload);

  Serial.printf("POST %s -> code %d\n", url.c_str(), code);
  if (code > 0) Serial.println(http.getString());
  http.end();
}
