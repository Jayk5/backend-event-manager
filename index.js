const express = require("express");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const path = require("path");
const session = require("express-session");
const LocalStrategy = require("passport-local");
let dburl = "mongodb://localhost:27017/AppDB";
const ejsMate = require("ejs-mate");
const sessionCfg = {
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};
app.use(session(sessionCfg));
mongoose.connect(dburl, {
    useNewURLParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("Database Connected");
});
const User = require("./models/user");
const Event = require("./models/event");
app.use(passport.initialize());
app.use(passport.session());
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.send({ msg: "Login first" });
    }
    next();
};

app.post("/register", async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const regUser = await User.register(user, password);
        res.status(200).send({ msg: `${username} user registered` });
    } catch (e) {
        console.log(e);
        res.status(400).send({ msg: e });
    }
});

app.post("/login", passport.authenticate("local"), (req, res) => {
    res.send({ msg: "Successfully logged in" });
});

app.get("/logout", isLoggedIn, (req, res) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.send({ msg: "Successfully logged out" });
    });
});

app.post("/changepass", isLoggedIn, (req, res) => {
    const { pass } = req.body;
    User.findByUsername(req.user.username).then(function (foundUser) {
        if (foundUser) {
            foundUser.setPassword(pass, () => {
                foundUser.save();
            });
            res.send({ msg: "Password changed" });
        } else {
            res.send({ msg: "NO user found" });
        }
    });
});

app.post("/event", isLoggedIn, async (req, res) => {
    const { name, invitees } = req.body;
    let invitedUsers = [];
    for (const invitee of invitees) {
        const user = await User.findByUsername(invitee);
        if (!user) {
            res.status(400).send({ msg: `${invitee} user not found` });
            return;
        }
        invitedUsers.push(user);
    }
    const event = new Event({ name, owner: req.user, invitees: invitedUsers });
    await event.save();
    for (const user of invitedUsers) {
        await user.invitedTo.push(event);
        await user.save();
    }
    res.send(event);
});

app.get("/event", isLoggedIn, async (req, res) => {
    const user_id = req.user._id;
    const list1 = await Event.find({ owner: user_id });
    const list2 = await req.user.populate("invitedTo");
    res.send({ owner: list1, invitedTo: list2.invitedTo });
});

app.post("/eventdetails", async (req, res) => {
    const { name } = req.body;
    const list = await Event.find({ name: name }).populate("invitees");
    res.send(list);
});

app.get("/", (req, res) => {
    res.send({ msg: "hello" });
});
app.listen(3000, () => {
    console.log("Listening on 3000");
});
