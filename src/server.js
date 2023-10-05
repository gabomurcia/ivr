const express = require('express');
const bodyParser = require('body-parser');
const { IvrInicialize, TranslateVoice, SwithOption } = require('./ivr-services');

const app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.urlencoded({ extended: false }))

app.all('/call', IvrInicialize)
app.post('/switch-option', SwithOption)
app.post('/translate', TranslateVoice)


app.listen(app.get('port'), () => {
	console.log('Node app is running on port', app.get('port'));
})