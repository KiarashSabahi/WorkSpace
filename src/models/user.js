import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import Schema from "mongoose";
import Cryptr from "cryptr";
const cryptr = new Cryptr('myTotallySecretKey');


//
const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate(value) {
            if(value.search(" ") !== -1){
                throw new Error('username cant contain space')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 4,
        validate(value) {
            if(value.toLowerCase().includes("password")){
                throw new Error("password must not inlude password")
            }
        }
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowerCase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error("Invalid Email!")
            }
        }
    },
    chats: [{
        type: Schema.ObjectId,
    }],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
},{
    timestamps: true
})


//token generator
userSchema.methods.generateAuthToken = async function () {
    const user = this;

    const token = jwt.sign({_id: user._id.toString()}, "user", {expiresIn: "2 days"});
    user.tokens.push({ token });

    await user.save();
    return token;
}

//hashing plain password
userSchema.pre("save", async function (next) {
    const user = this
    //hashing users password every time a new password is saved
    if (user.isModified("password")) {
        // user.password = await bcrypt.hash(user.password, 8);
        user.password = await cryptr.encrypt(user.password);

    }

    next();
})

//hiding password and tokens
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    //deleting password and token from response

    delete userObject.password;
    delete userObject.tokens;

    return userObject;
}

//finding account by email and password
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});
    if(!user) {
        throw ({error:'Unable to find the user'});
    }

    // const isMatch = await bcrypt.compare(password, user.password);
    // if(!isMatch) {
    //     throw ({error:'Password is incorrect'});
    // }

    if(cryptr.decrypt(user.password) != password) {
        throw ({error:'Password is incorrect'});
    }

    return user;
}




//
//creating user model
const User = mongoose.model("User", userSchema);


//
export default User;