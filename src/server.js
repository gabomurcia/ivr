const express = require("express"); // libreria para el uso de express
const bodyParser = require("body-parser"); // libreria para la captura de datos por POST
const {
	IvrInicialize,
	TranslateVoice,
	SwithOption,
} = require("./ivr-services"); // importar archivos con la logica del ivr

const app = express(); // incializar el server

app.set("port", process.env.PORT || 5000); // configuracion del puerto de la api

app.use(express.static(__dirname + "/public")); //configuracion  de archivos estaticos
app.use(express.json()); // configuracion del formato JSON
app.use(express.urlencoded({ extended: true })); // configuracion para el uso de datos por POST
app.use(bodyParser.urlencoded({ extended: false })); // configuracion para el uso de datos por POST

app.all("/call", IvrInicialize); // endpoint inicial para mandar a llamar al servicio de selecicon de digitios
app.post("/switch-option", SwithOption); // endpoint para el switch de opciones 1 para español y 2 para ingles
app.post("/translate/:id", TranslateVoice); // endpoint que traduce el idioma

app.listen(app.get("port"), () => {
	// inciar la api
	console.log("Node app is running on port", app.get("port"));
});
