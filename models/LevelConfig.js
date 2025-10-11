import mongoose, { Schema } from "mongoose";

const LevelConfigSchema = new mongoose.Schema({
    level : {
        type : Number ,
        required : true,
        unique : true,
        min :[1 , "level must be >= 1"],
    },
    levelName: {
        type: String,
        required: true,
        trim: true,
    },
    xpRequired :{
        type : Number,
        required : true,
        min : [1 ,"xpRequired must be >= 1"]
    },
    levelReward: {
        type: String,
        trim: true,
        default: "",
    },
    levelBadge: {
        type: String,
        required: true,
        trim: true,
    },
},{timestamps: true})

LevelConfigSchema.index({level : 1}, { unique: true });

const LevelConfig = mongoose.model("LevelConfig" , LevelConfigSchema);
export default LevelConfig;