const { Schema, model } = require("mongoose")

const Document = new Schema({
  _id: String,
  data: Object,
  UserID: Schema.Types.ObjectId,
  title: {
    type: String,
    default: 'Untitle Document'
  },
  PrivacyMode: {
    type: String,
    enum: ['private', 'view', 'edit'], 
    default: 'private',
  },
  Requests: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User' }], 
    default: [],
  },
  ViewPermission: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User' }], 
    default: [],
  },
  EditPermission: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User' }], 
    default: [],
  },
})

module.exports = model("Document", Document)