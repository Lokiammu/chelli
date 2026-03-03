const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLFloat,
} = require("graphql");

function createGraphqlSchema({ cropSupplyChain, store }) {
  const HistoryType = new GraphQLObjectType({
    name: "History",
    fields: {
      step: { type: GraphQLInt },
      role: { type: GraphQLString },
      date: { type: GraphQLString },
      cost: { type: GraphQLFloat },
      sender: { type: GraphQLString },
      receiver: { type: GraphQLString },
      note: { type: GraphQLString },
    },
  });

  const CropType = new GraphQLObjectType({
    name: "Crop",
    fields: {
      cropId: { type: GraphQLString },
      cropType: { type: GraphQLString },
      origin: { type: GraphQLString },
      currentStage: { type: GraphQLString },
      currentHolder: { type: GraphQLString },
      history: { type: new GraphQLList(HistoryType) },
      totalPrice: { type: GraphQLFloat },
      txHash: { type: GraphQLString },
    },
  });

  const RootQuery = new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
      traceCrop: {
        type: CropType,
        args: { cropId: { type: GraphQLString } },
        async resolve(_, args) {
          const cached = store.getCrop(args.cropId);
          if (cached) return cached;

          if (!cropSupplyChain?.methods?.getCrop) {
            return null;
          }

          try {
            const cropData = await cropSupplyChain.methods.getCrop(args.cropId).call();
            return {
              cropId: cropData[0],
              cropType: cropData[1],
              origin: cropData[2],
              currentStage: cropData[3],
              currentHolder: cropData[4],
              totalPrice: Number(cropData[5] || 0),
              history: [],
              txHash: null,
            };
          } catch (_) {
            return null;
          }
        },
      },
    },
  });

  const Mutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
      saveCrop: {
        type: CropType,
        args: {
          cropId: { type: GraphQLString },
          cropType: { type: GraphQLString },
          origin: { type: GraphQLString },
          currentStage: { type: GraphQLString },
          currentHolder: { type: GraphQLString },
          history: { type: new GraphQLList(GraphQLString) },
        },
        resolve(_, args) {
          return store.upsertCrop({
            cropId: args.cropId,
            cropType: args.cropType,
            origin: args.origin,
            currentStage: args.currentStage || "Created",
            currentHolder: args.currentHolder || "",
            history: [],
            totalPrice: 0,
            txHash: null,
          });
        },
      },
    },
  });

  return new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation,
  });
}

module.exports = createGraphqlSchema;
