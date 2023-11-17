const plivo = require("plivo"); // libreria plivo para el uso del servicio de ivr
const settingVoice = require("./setting-voice"); // diccionario de datos
const fs = require("fs"); //libreria para manejar la manipulacion de archivos
const translate = require("translate-google"); // libreria de google para la traduccion de palabras
const { format } = require("fecha"); // libreria para el manejo de fechas
const path = require("path"); //libreria para el manejo de rutas

/*

	la funcion IvrInicialize recibe dos parametros

	proposito ==> detectar la opcion que el usuario selecciona
	1 para español y 2 para ingles y pasarle la opcion selecionado
	al siguiente endpoint que es /switch-option

	params 1 => request
	 	para este caso este parametro no es utilizado
	params 2 => response
		el segundo parametro que es inyectado por express nos provee
		varios atributos de los cuales utilizamos el set y end
		para finalizar la peticion y responder al cliente que consume la funcion


*/
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

/*

	la funcion TranslateVoice recibe dos parametros

	proposito ==> traducir al ingles lo que el usuario diga por voz y
	guardarlo en un archivo

	params 1 => request
	 	para este caso utilizamos el parametro request que es inyectado por express
		el cual nos provee de la informacion sobre la peticion que se realizo.
		en eset caso lo usamos para obtener los valores enviados por body, que al ser utilizado por
		plivo nos envia la propiedad UnstableSpeech que captura lo que el usuario dice.
	params 2 => response
		el segundo parametro que es inyectado por express nos provee
		varios atributos de los cuales utilizamos el set y end
		para finalizar la peticion y responder al cliente que consume la funcion


*/

const TranslateVoice = async (request, response) => {
	// funcion para traduccir el texto
	const voiceText = request.body.UnstableSpeech ?? ""; // captura del texto
	const id = request.params.id; // id de la llamada
	const ivrStart = new plivo.Response(); //incio del servicio de plivo
	console.log("speech => ", request.body);

	if (voiceText !== "") {
		//compara si es una cadena vacia
		const timeZone = "America/Merida"; // clave de la zona horaria
		const meridaDate = new Date().toLocaleString("en-US", {
			timeZone: timeZone,
		}); // convierte la hora segun la zona horaria

		const formattedDate = new Intl.DateTimeFormat("en-US", {
			//configuracion del formato de fecha
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
			`${id}-${formattedDate.replace(/[, :/]/g, " ")}.txt`
		); //url de donde se guardara el archivo traduccido

		fs.readdir(path.resolve(__dirname), async (err, archivos) => {
			if (err) {
				console.error(
					`Error al leer el directorio ${directorio}: ${err}`
				);
				return;
			}

			console.log("id ===>", id);
			const nameFile = archivos.find((archivo) => {
				const array = archivo.split("-");

				if (array.length == 2) {
					const keyNameFile = array[0] ?? "";
					console.log("key showt", keyNameFile);
					return keyNameFile.includes(id);
				}

				return false;
			});

			console.log("file encontrado ===>", nameFile);
			if (nameFile) {
				const archivoPath = `${path.resolve(__dirname)}/${nameFile}`;
				// Si el ID coincide, lee el contenido del archivo
				fs.readFile(archivoPath, "utf8", async (err, data) => {
					console.log("frase original =>", voiceText);
					const voiceTextTranslate = await translate(voiceText, {
						to: "es",
					}); // traduccir el texto
					console.log("frase traducida =>", voiceTextTranslate);

					fs.writeFileSync(
						archivoPath,
						`${data} ${voiceTextTranslate}`,
						"utf-8"
					); // funcion para gurdar el archivo de text
				});
			} else {
				console.log("generar uno nue ===============");
				console.log("frase original =>", voiceText);
				const voiceTextTranslate = await translate(voiceText, {
					to: "es",
				}); // traduccir el texto
				console.log("frase traducida =>", voiceTextTranslate);

				fs.writeFileSync(filePath, voiceTextTranslate, "utf-8"); // funcion para gurdar el archivo de texto
			}
		});
	}

	ivrStart.addSpeak(settingVoice.operationEnglish); //funcion que se ejecuta si ocurre un error
	response.set({ "Content-Type": "text/xml" }); // formato de devolucion de la api
	response.end(ivrStart.toXML()); //finaliza la peticion
};

/*

	la funcion SwithOption recibe dos parametros

	params 1 => request
	 	para este caso utilizamos el parametro request que es inyectado por express
		el cual nos provee de la informacion sobre la peticion que se realizo.
		en este caso lo usamos para obtener los valores enviados por body, que al ser utilizado por
		plivo nos envia la propiedad Digits que es la opcion que el usuario selecciono
	params 2 => response
		el segundo parametro que es inyectado por express nos provee
		varios atributos de los cuales utilizamos el set y end
		para finalizar la peticion y responder al cliente que consume la funcion


*/
const SwithOption = (request, response) => {
	// funcion para el switch de opciones
	const { Digits } = request.body; // se obtiene el digito seleccionado
	const ivrStart = new plivo.Response();
	const isOptionEnglish = "2"; // 2 si es ingles
	const isOptionSpanish = "1"; // 1 si es español

	console.log(Digits);

	if (Digits === isOptionSpanish) {
		// compara si la opcion es español finaliza la operacion
		// si es español
		console.log("is option 1");
		ivrStart.addSpeak(settingVoice.operationSpanish); // frase que se dice si se cumple la condicion

		response.set({ "Content-Type": "text/xml" }); // formato de devolucion de la api
		response.end(ivrStart.toXML()); //finaliza la peticion

		return;
	}

	if (Digits === isOptionEnglish) {
		// si es ingles se manda a ejecutar el endpoint que traduce la voz del usuario
		// si es ingles
		console.log("is option 2");
		const id = Math.random().toString(36).substring(2, 8); // genera un id para la llamada
		console.log(id);
		const getInput = ivrStart.addGetInput({
			action: `${settingVoice.host}/translate/${id}`, // url del metodo que hace la traduccion
			interimSpeechResultsCallback: `${settingVoice.host}/translate/${id}`, // url del metodo que hace la traduccion
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

		response.set({ "Content-Type": "text/xml" }); // formato de devolucion de la api
		response.end(ivrStart.toXML()); //finaliza la peticion
	}
};

module.exports = { IvrInicialize, TranslateVoice, SwithOption }; // exportamos las funciones
