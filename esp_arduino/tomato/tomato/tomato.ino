#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <math.h>

// ---------------- CONFIG ----------------
const char* ssid     = "Airtel_Sim";
const char* password = "Bala2001@";
const char* backendHost = "192.168.1.6";   // PC IPv4
const int backendPort = 3000;
const char* backendPath = "/updateFreshness";

// ThingSpeak
const char* thingSpeakHost = "api.thingspeak.com";
String thingSpeakAPIKey = "FKPXUB3Q8EY5ZSAF";

// ---------------- PRODUCT CONFIG ----------------
const char* PRODUCT_ID = "CROP-52d55039";   

// ---------------- PINS ----------------
const int MQ_PIN  = A0;
const int LED_PIN = D2;
const int DHT_PIN = D5;

#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);

// ---------------- MQ135 PARAMETERS ----------------
const float RL_VALUE = 10.0;
const float R0 = 10.0;
const float ADC_MAX = 1023.0;
const float VREF = 1.0;

// MQ135 curve
const float a_curve = 110.47;
const float b_curve = -2.862;

// Timing
unsigned long lastSense = 0;
const unsigned long senseInterval = 20000; // 20 seconds

// =================================================
// SETUP
// =================================================
void setup() {
  Serial.begin(115200);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  connectWiFi();
  dht.begin();
}

// =================================================
// LOOP
// =================================================
void loop() {
  if (millis() - lastSense >= senseInterval) {
    lastSense = millis();
    digitalWrite(LED_PIN, HIGH);

    float voc = senseVOC();
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("❌ Failed to read from DHT11");
      temperature = 0;
      humidity = 0;
    }

    String stage = mapStage(voc);

    Serial.printf(
      "VOC: %.2f ppm | Temp: %.2f °C | Hum: %.2f %% | Stage: %s\n",
      voc, temperature, humidity, stage.c_str()
    );

    static int counter = 0;
    counter++;

    if (true) {   // store every 3 cycles (~1 min)
      sendToBackend(PRODUCT_ID, voc, temperature, humidity);
    }

    sendToThingSpeak(voc, temperature, humidity);

    digitalWrite(LED_PIN, LOW);
  }

  delay(200);
}

// =================================================
// WIFI
// =================================================
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

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("✅ Connected! ESP IP: %s\n",
                  WiFi.localIP().toString().c_str());
  } else {
    Serial.println("❌ WiFi connection failed!");
  }
}

// =================================================
// MQ135 VOC
// =================================================
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

// =================================================
// STAGE MAPPING
// =================================================
String mapStage(float ppm) {
  if (ppm < 0.05) return "Fresh";
  else if (ppm < 0.1) return "Ripening";
  else return "Spoiled";
}

// =================================================
// SEND TO BACKEND
// =================================================
void sendToBackend(const char* productId, float voc, float temp, float hum) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected");
    return;
  }

  WiFiClient client;
  HTTPClient http;

  http.setTimeout(15000);
  http.setReuse(false);
  client.setNoDelay(true);

  String url = String("http://") + backendHost + ":" + backendPort + backendPath;
  Serial.println("➡ POSTING TO:");
  Serial.println(url);

  if (!http.begin(client, url)) {
    Serial.println("❌ http.begin() failed");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("Connection", "close");

  StaticJsonDocument<384> doc;
  doc["productId"]   = productId;   // ✅ STRING ID
  doc["voc"]         = voc;
  doc["temperature"] = temp;
  doc["humidity"]    = hum;

  String payload;
  serializeJson(doc, payload);

  Serial.print("📦 Payload: ");
  Serial.println(payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.printf("✅ HTTP POST code: %d\n", httpCode);
    Serial.println(http.getString());
  } else {
    Serial.printf("❌ HTTP POST failed (%d): %s\n",
                  httpCode,
                  http.errorToString(httpCode).c_str());
  }

  http.end();
  client.stop();
}


// =================================================
// SEND TO THINGSPEAK
// =================================================
void sendToThingSpeak(float voc, float temp, float hum) {
  WiFiClient client;

  if (!client.connect(thingSpeakHost, 80)) {
    Serial.println("❌ ThingSpeak connect FAILED");
    return;
  }

  String url = "/update?api_key=" + thingSpeakAPIKey +
               "&field1=" + String(voc, 4) +
               "&field2=" + String(temp, 2) +
               "&field3=" + String(hum, 2);

  client.print(String("GET ") + url + " HTTP/1.1\r\n" +
               "Host: api.thingspeak.com\r\n" +
               "Connection: close\r\n\r\n");

  delay(200);

  while (client.available()) {
    String line = client.readStringUntil('\n');
    Serial.println(line);
  }
}