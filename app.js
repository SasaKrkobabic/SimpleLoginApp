const express = require('express');
const app = express();
require('dotenv').config();
const { auth, requiresAuth } = require('express-openid-connect');

app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))

comMaxId = 3
teams = [
    { name:"Dinamo", goals: 0, score: 0},
    { name:"Hajduk", goals: 0, score: 0}]
comments = [
    {id:1, user:"Admin", time: new Date(), text:"Bravo"},
    {id:2, user:"Ana", time: new Date(), text:"Super"},
    {id:3, user: "Pero", time: new Date(), text: "Svaka cast"}];
games = [
    {id:0, team1:teams[0].name, team2: teams[1].name, score1: 2, score2: 1},
    {id:1, team1:teams[1].name, team2: teams[0].name, score1: 3, score2: 4}]

app.use(
    auth({
        issuerBaseURL: process.env.ISSUER_BASE_URL,
        baseURL: process.env.BASE_URL,
        clientID: process.env.CLIENT_ID,
        secret: process.env.SECRET,
        idpLogout: true,
        authRequired: false
    })
);

function initData() {
    teams[0].score = 0
    teams[0].goals = 0
    teams[1].score = 0
    teams[1].goals = 0

    if (teams[0].name == "Dinamo") {
        teams[0].goals = +games[0].score1 + games[1].score2
        teams[1].goals = +games[0].score2 + games[1].score1
    } else {
        teams[1].goals = +games[0].score1 + games[1].score2
        teams[0].goals = +games[0].score2 + games[1].score1
    }

    if (games[0].score1 > games[0].score2) teams[0].score = + teams[0].score + 3
    else if (games[0].score1 < games[0].score2) teams[1].score = + teams[1].score + 3
    else {
        teams[0].score = + teams[0].score + 1
        teams[1].score = + teams[1].score + 1
    }

    if (games[1].score1 > games[1].score2) teams[1].score = + teams[1].score + 3
    else if (games[1].score1 < games[1].score2) teams[0].score = + teams[0].score + 3
    else {
        teams[0].score = + teams[0].score + 1
        teams[1].score = + teams[1].score + 1
    }

    if (teams[0].score < teams[1].score) {
        let temp = teams[0]
        teams[0] = teams[1]
        teams[1] = temp
    } else if (teams[0].score == teams[1].score && teams[0].goals < teams[1].goals) {
        let temp = teams[0]
        teams[0] = teams[1]
        teams[1] = temp
    }
}

app.get('/', (req, res) => {
    initData()
    let name = ""
    try {
        name = req.oidc.user.name
    } catch (e) {
        name = "Not logged in"
    }
    res.render('home.ejs', {
        loggedIn: req.oidc.isAuthenticated() ,
        name: name,
        teams: teams,
        games: games,
        comments: comments})
});

app.get('/userinfo', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user))
});

app.post('/editgame', (req, res) => {
    for (let i = 0; i < games.length; i++) {
        if (games[i].id == req.query.id) {
            games[i].score1 = +req.body.score1;
            games[i].score2 = +req.body.score2;
            break;
        }
    }
    res.redirect('/');
});

app.post('/addcomment', (req, res) => {
    comments.push({
        id:++comMaxId, user: req.oidc.user.name, time: new Date(), text: req.body.newcomment
    });
    res.redirect('/');
});

app.post('/editcomment', (req, res) => {
    comments.forEach((c) => {
        if (c.id == req.query.id) {
            c.text = req.body.comment;
        }
    })
    res.redirect('/');
});

app.post('/deletecomment', (req, res) => {
    let newComments = [];
    comments.forEach((c) => {
        if (c.id != req.query.id) {
            newComments.push(c);
        }
    })
    comments = newComments;
    res.redirect('/');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('Listening at port ' + port);
})
