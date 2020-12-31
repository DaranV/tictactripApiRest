const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const accessTokenSecret = 'METTREVOTREACCESSTOKEN';

const app = express();

app.use(express.urlencoded());
app.use(bodyParser.json());

app.use((res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    next();
  });


  app.post('/api/token', (req, res) => {
    console.log(req.body);
    res.status(201).json({
      token: jwt.sign(
        { mail: req.body.email},
        accessTokenSecret,
        { expiresIn: '24h' }
      ),
    });
  });
  
  const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, accessTokenSecret, (err, email) => {
            if (err) {
                return res.sendStatus(403);
            }

            req.email = email;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};


var mails = new Array();

  app.post('/api/justify', authenticateJWT, (req, res) => {
    console.log(req.body);

    text = req.body.texte;
    tabMot = text.split(" ");

    // Si l'adresse n'existe pas dans le tableau de mails alors on l'ajoute
    if(!(req.email.mail in mails)){
      mails[req.email.mail] = 0;
    }

    var nouvelleTaille = mails[req.email.mail] + tabMot.length;

    if((Math.floor(Date.now() / 1000)) - req.email.exp > 0 ){
      if(nouvelleTaille <= 800){
        res.status(201).json({
          texte: justify(req.body.texte),
          mail: req.email.mail,
        });
        mails[req.email.mail] += tabMot.length;
      }else{
        //rate limit
        res.status(402).send("Payment Required")
      }      
    }else{
      //rate limit remis à zéro
      mails[req.email.mail] = 0;
    }
    console.log(mails);
  });

    function justify(texte){
      var chaine = [];
      chaine = texte.split(' ');
      return justification(chaine, 80);
    }

  function justification(chaine, L) {
    lines = [];
    index = 0;
    
    // parcours chaque mots du texte qui sont stockés dans le tableau
    while(index < chaine.length) {
        tailleMot = chaine[index].length; 
        last = index + 1;
        
        while(last < chaine.length) {
            if (chaine[last].length + tailleMot + 1 < L){ // le 1 correspond à l'espace
              tailleMot += chaine[last].length + 1;
              last++;
            }else{
              break;
            }
        }
        
        line = "";
        difference = last - index - 1;
        
        if (last == chaine.length || difference == 0) {
            for (i = index; i < last; i++) {
                line += chaine[i] + " ";
            }
            
            line = line.substr(0, line.length - 1);
            for (i = line.length; i < L; i++) {
                line += " ";
            }
        } else {
            spaces = (L - tailleMot) / difference;
            remainder = (L - tailleMot) % difference;
            
            for (i = index; i < last; i++) {
                line += chaine[i];
                
                if( i < last - 1) {
                    limit = spaces + ((i - index) < remainder ? 1 : 0)
                    for (j = 0; j <= limit; j++) {
                        line += " ";
                    }
                }
            }
        }
        lines.push(line);
        index = last;
    }
    return lines;
}

module.exports = app;