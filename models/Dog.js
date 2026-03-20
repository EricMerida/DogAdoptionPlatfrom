const mongoose = require("mongoose");

const dogSchema = new mongoose.Schema(
  {
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    description: { 
        type: String, 
        required: true, 
        trim: true 
    },

    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true
     },

    status: { 
        type: String, 
        enum: ["available", "adopted"], 
        default: "available" 
    },

    adopter: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        default: null 
    },
    thankYouMessage: { 
        type: String, 
        default: null 
    },
    adoptedAt: { 
        type: Date, 
        default: null 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dog", dogSchema);