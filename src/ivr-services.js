const plivo = require('plivo');
const settingVoice = require('./setting-voice');
const fs = require('fs');
const translate = require('translate-google');
const { format } = require('fecha');


const IvrInicialize = (request, response) => {
	const ivrStart = new plivo.Response();
	const getInput = ivrStart.addGetInput(
		{
			'action': `${settingVoice.host}/switch-option`,
			"method": 'POST',
			'inputType': 'dtmf',
			'digitEndTimeout': '5',
			'language': 'en-US', // colocar el codigo del idioma
			'redirect': 'true',
			'finishOnKey': '#',
			'log': 'true'
		}
	);

	getInput.addSpeak(`${settingVoice.welcome} ${settingVoice.option}`)
	ivrStart.addSpeak(settingVoice.errorSelect)
	console.log('----------------------------------------------')
	response.set({ 'Content-Type': 'text/xml' })
	response.end(ivrStart.toXML())
}

const TranslateVoice = async (request, response) => {
	const timeZone = 'America/Merida';
	const meridaDate = new Date().toLocaleString('en-US', { timeZone: timeZone });
	const formattedDate = new Intl.DateTimeFormat('en-US', {
	timeZone: timeZone,
	weekday: 'long',
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hour12: true
	}).format(new Date(meridaDate));

	const voiceText = request.body.UnstableSpeech ?? ''
	const ivrStart = new plivo.Response()

	console.log('speech => ', request.body)
	if(voiceText !== ''){
		console.log('frase original =>', voiceText)
		const voiceTextTranslate = await translate(voiceText,{ to: 'es' })
		console.log('frase traducida =>',voiceTextTranslate)
		
		fs.writeFileSync(`${formattedDate}.txt`, voiceTextTranslate, 'utf-8');
	}

	ivrStart.addSpeak(settingVoice.operationEnglish)
	response.set({ 'Content-Type': 'text/xml' })
	response.end(ivrStart.toXML())
}

const SwithOption = (request, response) => {
	const { Digits } = request.body
	const ivrStart = new plivo.Response()
	const isOptionEnglish = '2'
	const isOptionSpanish = '1' 

	if(Digits === isOptionSpanish){
		console.log('is option 1')
		ivrStart.addSpeak(settingVoice.operationSpanish)

		response.set({ 'Content-Type': 'text/xml' })
		response.end(ivrStart.toXML());

		return
	}

	if(Digits === isOptionEnglish ){
		console.log('is option 2')
		const getInput = ivrStart.addGetInput(
			{
				'action': `${settingVoice.host}/translate`,
				'interimSpeechResultsCallback': `${settingVoice.host}/translate`,
				'interimSpeechResultsCallbackMethod': 'POST',
				'inputType': 'speech',
				'language': 'en-US', // colocar el codigo del idioma
				'redirect': 'true',
				'speechEndTimeout': '10',
				'log': 'true'
			}
		);
	
		getInput.addSpeak(settingVoice.operationEnglishStart)
		ivrStart.addSpeak(settingVoice.operationEnglish)
		console.log('----------------------------------------------')
		response.set({ 'Content-Type': 'text/xml' })
		response.end(ivrStart.toXML())
	}

}


module.exports = {IvrInicialize, TranslateVoice , SwithOption}