export const TRACE_CROP_QUERY = `
  query TraceCrop($cropId: String!) {
    traceCrop(cropId: $cropId) {
      cropId
      cropType
      origin
      currentStage
      currentHolder
      totalPrice
      history {
        step
        role
        date
        cost
        sender
        receiver
        note
      }
    }
  }
`;
