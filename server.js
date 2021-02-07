/**
 *  LICENSE: 
 */
// Module Imports
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path"); // The path isn't required yet but it will be once we start creting the image system
const bodyParser = require("body-parser");
const { urlencoded } = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken")

// setting some required data
const app = express();
const PORT = process.env.PORT || 80;
const DBURI = "mongodb+srv://bosdos12:112211@engineerschat.dkhym.mongodb.net/EngineersChatDB?retryWrites=true&w=majority";
const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false })

// Importing The Schemas
const User = require("./Schema/User");

// importing the error functions
const errorOnDBquerry = require("./errors/errorOnDBquerry");

/**
 *  SOME GENERALISED CODE BELOW
 */

// connecting to the mongodb database and hosting the server
mongoose.connect(DBURI, {useUnifiedTopology: true, useNewUrlParser: true})
.then(CTD_res => {
    app.listen(PORT, "192.168.42.232", () => {
        console.log(`SUCCESFULLY CONNECTED TO THE SERVER`);
    });
}).catch(err => {
    console.log(err);
});
app.set("view engine", "ejs");
app.set("Views", "Views");
app.use(express.static(__dirname + "/public"));
app.use(urlencoded({extended: true}))
app.use(express.json());


/* PROFILE PICTURE UPLOADING FUNCTIONS */
// Set Storage Engine
const storage = multer.diskStorage({
    destination: "./public/pfp/",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});
// Init Upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5242880
    },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single("upfp");
// Check File Type
const checkFileType = (file, cb) => {
    // allowed axtensions
    const filetypes = /jpeg|png|jpg|gif/;
    // check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // check mime type
    const mimetype = filetypes.test(file.mimetype);
    
    // checking if all are true
    if (mimetype, extname) {
        return cb(null, true);
    } else {
        cb("Error: Images Only!");
    }
}

/**
 *  ================================
 *  THE PAGES AND ALL OF THEIR CODES
 *  ================================
 */

/**
 * homepage/entry page
 */
app.get('/', (req, res) => {
    res.render("index");
})
// homepage end

/**
 * loginpage
 */ 
// login page get request just for displaying the login page
app.get("/login", (req, res) => {
    // also rendering the error messages as undefined
    res.render("login", {
        usernameNotEntered: undefined,
        usernameNotFound: undefined,
        passwordNotEntered: undefined,
        wrongPassword: undefined
    });
})

// login page post request for logging in
// and all of the validations
app.post("/login", (req, res, next) => {
    // saving the request segments into variables for easier access
    let username = req.body.username;
    let password = req.body.password;
    console.log(`${username}\n${password}\n\n`);
    // checking the system validity
    if (username != undefined && username.length > 0) {
        if (password != undefined && password.length > 0) {
            User.find({username: username})
            .then(FoundUserRes => {
                if (FoundUserRes.length > 0) {
                    if (password == FoundUserRes[0].password) {
                        // succesfull login!  
                        // now as the user data is already set in localstorage via frontend,
                        // we will just redirect the user to UHP and get their localStorage data
                        // validate it via our validation route and then give an error or the user data back via server and ejs tags
                        // and we will be good! also our EVERY request from the UHP will require both the username and the password so its secure
                        // 
                        res.redirect("/UserHomePage");
                    } else {
                        res.render("login", {wrongPassword: `Invalid password, please try again!`});
                    };
                } else {
                    res.render("login", {usernameNotEntered: `The account with the username of [${username}] doesn't exist.`})
                };
            }).catch(err => {
                // this error gives us a console feedback based on the error we get
                errorOnDBquerry(err, `${req.protocol}://${req.get("host")}${req.originalUrl}`);
            });
        } else res.render("login", {passwordNotEntered: "Nice try, but not good enough lol."});
    } else res.render("login", {usernameNotEntered: "Please enter a username, you wannabe hacker."});
});
// loginpage end

/**
 *  SIGNUP PAGE
 */
// the signup page get req
app.get("/signup", (req, res) => {
    res.render("signup");
})
// the signup page post req (NOTE: this is the signup reqest)
app.post("/signup", (req, res) => {
    // note: dont forget to check if values are undefined too 
    // as some script kiddie is all it takes to remove your page's html elements
    console.log(req.body)
    // putting the req elements in variables for easier access
    let username = req.body.username
    let email = req.body.email
    let birthYear = req.body.birthYear
    let password = req.body.password
    let passwordConfirmation = req.body.passwordConfirmation
    let pronouns = req.body.pronouns;

    if (username != undefined && username.length > 0) {
        if (email != undefined && email.length > 0) {
            // email regex check
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (re.test(String(email))) {
                if (birthYear != undefined && !isNaN(birthYear) && String(birthYear).length == String(new Date().getFullYear()).length) {
                    if (password != undefined && password.length > 0) {
                        if (password.length > 5) {
                            if (password == passwordConfirmation) {
                                if (pronouns != undefined && pronouns == "he/him" || pronouns == "she/her" || pronouns == "them/they") {
                                    // all the "system" validity checks have been succeeded
                                    // now we can fetch the data from the database and see if the data is still valid
                                    User.find({username: username})
                                    .then(usnSrcRes => {
                                        if (usnSrcRes.length == 0) { // usn val
                                            User.find({email: email})
                                            .then(emailSrcRes => {
                                                if (emailSrcRes.length == 0) { // email val
                                                    // succesfull signup, now we can create the new account
                                                    let NewUser = new User({
                                                        username: username,
                                                        email: email,
                                                        password: password,
                                                        birthYear: birthYear,
                                                        createdOn: new Date()
                                                    })
                                                    NewUser.save();
                                                    res.redirect("/UserHomePage");
                                                    
                                                } else res.render("signup", {emailAlreadyUsed: `The entered email [${email}] is already used`});
                                            }).catch(err => {
                                                errorOnDBquerry(err, `${req.protocol}://${req.get("host")}${req.originalUrl}`);
                                            })
                                        } else res.render("signup", {usernameAlreadyUsed: `The entered username [${username}] is already used`});
                                    }).catch(err => {
                                        errorOnDBquerry(err, `${req.protocol}://${req.get("host")}${req.originalUrl}`);
                                    })
                                    
                                } else res.render("signup", {invalidPronouns: "Please enter valid personal pronouns"});
                            } else res.render("signup", {passwordConfNotMatching: "The password and the confirmation passwords arent matching"});
                        } else res.render("signup", {tooShortPass: "The password has to be at least 6 characters long"});
                    } else res.render("signup", {passwordNotEntered: "Please enter a password"});
                } else res.render("signup", {invalidBY: "Please enter a valid birth year"});
            } else res.render("signup", {invalidEmail: "Please enter a valid email"});
        } else res.render("signup", {emailNotEntered: "Please enter an email"});
    } else res.render("signup", {usernameNotEntered: "Please enter a username"});
});

// signup page end

/**
 *  USER HOME PAGE
 */
app.get("/UserHomePage", (req, res) => {
    // we will get their localStorage data
    // validate it via our validation route and then give an error or the user data 
    // back via server and ejs tags
    // and we will be good! also our EVERY request from the UHP will require both the 
    // username and the password so its secure
    res.render("UserHomePage.ejs");
});

// homepage normal post requests
app.post("/UserHomePage", (req, res) => {
    res.render("UserHomePage");
});
// UserHomePage end

/**
 *  THE ROUTE FOR GETTING THE USER DATA WITH THE LS
 */
app.post("/getUserDataUHP", jsonParser, (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (username != undefined && username != null && username.length > 0) {
        if (password != undefined && password != null && password.length > 0) {
            User.find({username}).then(gottenUserRes => {
                // checking if the ls user is actually a valid user
                if (gottenUserRes.length > 0) {
                    if (gottenUserRes[0].password == password) {
                        // returning ONLY the *safe* data
                        // note: this is the homepage, not the user personal page
                        res.json({userData: {
                            username: gottenUserRes[0].username,
                            email: gottenUserRes[0].email,
                            PFP_Path: gottenUserRes[0].PFP_Path,
                            followedAccounts: gottenUserRes[0].followedAccounts,
                            recentViewedAccs: gottenUserRes[0].recentViewedAccs,
                            recentLikedCategories: gottenUserRes[0].recentLikedCategoriesm,
                            recentSearchedAccounts: gottenUserRes[0].recentSearchedAccounts
                        }});
                    } else res.json({userData: "invalidLS"});
                } else res.json({userData: "invalidLS"});
            }).catch(err => errorOnDBquerry(err, `${req.protocol}://${req.get("host")}${req.originalUrl}`));
        } else res.json({userData: "invalidLS"});
    } else res.json({userData: "invalidLS"});
});

app.get("/PleaseLogin", (req, res) => {
    res.send("<h1>The route you are trying to access is protected, please login first</h1>");
})

/**
 *  THE CURRENT USER PERSONAL PAGE
 */
app.get("/cu/:username", (req, res) => {
    res.render("cu_personalPage")
})
// error function, to send to frontend.
const jsResError = () => {
    res.json({jsres: "error"});
};
// validate personal page info, then display the data
app.post('/user/personalPagePR', jsonParser, (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (username != undefined && username != null && username.length > 0) {
        if (password != undefined && password != null && password.length > 5) {
            User.find({username}).then(userRes => {
                if (userRes.length > 0) {
                    if (userRes[0].password == password) {
                        // validation succesfull, jsoning the user data
                        res.json({jsres: {
                            userID: userRes[0]._id,
                            username: userRes[0].username,
                            email: userRes[0].email,
                            PFP_Path: userRes[0].PFP_Path,
                            bio: userRes[0].bio,
                            posts: userRes[0].posts,
                            createdOn: userRes[0].createdOn,
                            followerAccounts: userRes[0].followedAccounts,
                            followerAmount: userRes[0].followerAmount,
                            followedAccounts: userRes[0].followedAccounts,
                            followedAmount: userRes[0].followedAmount,
                            recentLikedCategories: userRes[0].recentLikedCategories

                        }});
                    } else jsResError();
                } else jsResError();
            }).catch(err => errorOnDBquerry(err, `${req.protocol}://${req.get("host")}${req.originalUrl}`));
        } else jsResError();
    } else jsResError();
});
// --- current user personal page end ---

/**
 *  SETTINGS PAGE
 */
app.get("/user/settings", (req, res) => {
    res.render("settings");
});

// --- settings page end ---

/**
 *  FOLLOWERS/FOLLOWINGS/CATEGORIES PATHS
 */
// followers
const checkIfUsernameExists = (req, res, next) => {
    // checking if the user exists, then displaying the data via ejs tags
    User.find({_id: req.params.uid}).then(dbRes => {
        if (dbRes.length > 0) {
			req.state = true;
			req.userPosts = (dbRes[0]);
			next();
        } else {
            req.state = false;
			next();
        };
    }).catch(dbErr => {
        req.state = false;
        next();
    });
};
// followers
app.get("/user/followers/:uid", checkIfUsernameExists, (req, res) => {
	/**
	 * if username exists, the function will return
	 * a true in req.state, otherwise, it will return false
	 * and those are all we need to run a good if/else statement.
	 */
	let reqData = req.userPosts;
	let userData = req.userPosts;
	console.log(userData.followerAccounts);
	if (req.state) {
		res.render("Followers.ejs", {doDisplay: true, dispData: userData.followerAccounts, USN: userData.username});
	} else {
		res.render("Followers.ejs", {doDisplay: false});
	};
});
// followings
app.get("/user/followings/:uid", checkIfUsernameExists, (req, res) => {
	if (req.state) {
		res.render("Followings.ejs", {doDisplay: true});
	} else {
		res.render("Followings.ejs", {doDisplay: false});
	};
});
// categories
app.get("/user/liked-categories/:uid", checkIfUsernameExists, (req, res) => {
	if (req.state) {
		res.render("Categories.ejs", {doDisplay: true});
	} else {
		res.render("Categories.ejs", {doDisplay: false});
	};
});




























// 404
app.use((req, res) => {
    res.send("<h1>[404], page doesnt exist.");
});







