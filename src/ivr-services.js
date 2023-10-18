const plivo = require("plivo"); // libreria plivo para el uso del servicio de ivr
const settingVoice = require("./setting-voice"); // diccionario de datos
const fs = require("fs"); //libreria para manejar la manipulacion de archivos
const translate = require("translate-google"); // libreria de google para la traduccion de palabras
const { format } = require("fecha"); // libreria para el manejo de fechas
const path = require("path"); //libreria para el manejo de rutas

const IvrInicialize = (request, response) => {
	// funcion para iniciar el ivr
	const ivrStart = new plivo.Response(); // inicio del servicio del irv
	const getInput = ivrStart.addGetInput({
		action: `${settingVoice.host}/switch-option`, // url que switchea determinada accional selecionar 1 u 2
		method: "POST", // verbo http
		inputType: "dtmf", // tipo de captura por digito
		digitEndTimeout: "5", // tiempo de espera para escribir los digitos en el celular
		language: "es-MX", // idioma del operador
		redirect: "true", // redireccionar a la url del switcheo
		finishOnKey: "#", // tecla para finalizar la captura de digitos, es opcional
		log: "true", // marcar log en plivo de las llamadas
	}); // configuracion para la captura de digitos del telefono que marca al ivr

	getInput.addSpeak(`${settingVoice.welcome} ${settingVoice.option}`); // frase inicial de bienvenida
	ivrStart.addSpeak(settingVoice.errorSelect); // frase que se menciona si ocurre un error
	console.log("----------------------------------------------");
	response.set({ "Content-Type": "text/xml" }); // formato de devolucion de la api
	response.end(ivrStart.toXML()); // finalizar el metodo
};

const TranslateVoice = async (request, response) => {
	// funcion para traduccir el texto
	const voiceText = request.body.UnstableSpeech ?? ""; // captura del texto
	const ivrStart = new plivo.Response(); //incio del servicio de plivo
	console.log("speech => ", request.body);

	if (voiceText !== "") {
		const timeZone = "America/Merida";
		const meridaDate = new Date().toLocaleString("en-US", {
			timeZone: timeZone,
		});

		const formattedDate = new Intl.DateTimeFormat("en-US", {
			timeZone: timeZone,
			weekday: "long",
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: true,
		}).format(new Date(meridaDate)); // dar formato a la fecha con hora actual

		const filePath = path.resolve(
			__dirname,
			`${formattedDate.replace(/[, :/]/g, " ")}.txt`
		); //url de donde se guardara el archivo traduccido

		console.log("frase original =>", voiceText);
		const voiceTextTranslate = await translate(voiceText, { to: "es" }); // traduccir el texto
		console.log("frase traducida =>", voiceTextTranslate);

		fs.writeFileSync(filePath, voiceTextTranslate, "utf-8"); // funcion para gurdar el archivo de texto
	}

	ivrStart.addSpeak(settingVoice.operationEnglish); //funcion que se ejecuta si ocurre un error
	response.set({ "Content-Type": "text/xml" });
	response.end(ivrStart.toXML());
};

const SwithOption = (request, response) => {
	// funcion para el switch de opciones
	const { Digits } = request.body; // se obtiene el digito seleccionado
	const ivrStart = new plivo.Response();
	const isOptionEnglish = "2";
	const isOptionSpanish = "1";

	if (Digits === isOptionSpanish) {
		// si es español
		console.log("is option 1");
		ivrStart.addSpeak(settingVoice.operationSpanish); // frase que se dice si se cumple la condicion

		response.set({ "Content-Type": "text/xml" });
		response.end(ivrStart.toXML());

		return;
	}

	if (Digits === isOptionEnglish) {
		// si es ingles
		console.log("is option 2");
		const getInput = ivrStart.addGetInput({
			action: `${settingVoice.host}/translate`, // url del metodo que hace la traduccion
			interimSpeechResultsCallback: `${settingVoice.host}/translate`, // url del metodo que hace la traduccion
			interimSpeechResultsCallbackMethod: "POST", // verbo http
			inputType: "speech", // tipo de captura por voz
			language: "en-US", // colocar el codigo del idioma
			redirect: "true",
			speechEndTimeout: "10",
			log: "true",
		}); // configuracion  para la captura de palabras

		getInput.addSpeak(settingVoice.operationEnglishStart); // frase que se dice si se cumple la condicion
		ivrStart.addSpeak(settingVoice.operationEnglish); // frase que se dice si ocurre un error
		console.log("----------------------------------------------");
		response.set({ "Content-Type": "text/xml" });
		response.end(ivrStart.toXML());
	}
};

module.exports = { IvrInicialize, TranslateVoice, SwithOption };
