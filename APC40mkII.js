//Init sequence to send Sysex

local.sendCC(1, 0, 0); //ResetLaunckey
local.sendNoteOn(1, 0x0C, 0x7F);//Enable inControl
local.sendSysex(0x7E, 0x7F, 6, 1); //This will send 4 bytes
 
local.sendCC(1, 0, 40); 
local.sendCC(1, 7, 108);
 
// noted in [channel,note]
var noteNotes = {
	pads:
	{
		main: [
			[[1,32], [1,33], [1,34], [1,35], [1,36], [1,37], [1,38], [1,39]],
			[[1,24], [1,25], [1,26], [1,27], [1,28], [1,29], [1,30], [1,31]],
			[[1,16], [1,17], [1,18], [1,19], [1,20], [1,21], [1,22], [1,23]],
			[[1, 8], [1, 9], [1,10], [1,11], [1,12], [1,13], [1,14], [1,15]],
			[[1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7]],
			[[1,52], [2,52], [3,52], [4,52], [5,52], [6,52], [7,52], [8,52]],
			[[1,51], [2,51], [3,51], [4,51], [5,51], [6,51], [7,51], [8,51]]
		],
		faders: [
			[[1,50], [1,66], [1,49], [1,48]],
			[[2,50], [2,66], [2,49], [2,48]],
			[[3,50], [3,66], [3,49], [3,48]],
			[[4,50], [4,66], [4,49], [4,48]],
			[[5,50], [5,66], [5,49], [5,48]],
			[[6,50], [6,66], [6,49], [6,48]],
			[[7,50], [7,66], [7,49], [7,48]],
			[[8,50], [8,66], [8,49], [8,48]]
		]
	},
	buttons:
	{

	},
};

var ccNotes = {
	encoders: {
		top: [[1,48], [1,49], [1,50], [1,51], [1,52], [1,53], [1,54], [1,55]],
		side: [[1,16], [1,17], [1,18], [1,19], [1,20], [1,21], [1,22], [1,23]],
		cue: [1,47],
		tempo: [1,13]
	},
	faders: [[1,7], [2,7], [3,7], [4,7], [5,7], [6,7], [7,7], [8,7], [1,14], [1,15]]
};

var noteValueObj = [[],[],[],[],[],[],[],[],[]];
var ccValueObj = [[],[],[],[],[],[],[],[],[]];
var colorParameterObj = [];
var pulsingParameterObj = [];

var pulsingSteps = 128;
var pulsingTable = [0, 13, 26, 40, 53, 67, 80, 93, 107, 120, 134, 147, 161, 174, 187, 201, 214, 228, 255, 255, 252, 250, 247, 245, 243, 240, 238, 236, 233, 231, 229, 226, 224, 222, 219, 217, 215, 212, 210, 208, 205, 203, 201, 198, 196, 194, 191, 189, 187, 184, 182, 180, 177, 175, 173, 170, 168, 166, 163, 161, 159, 156, 154, 152, 149, 147, 145, 142, 140, 138, 135, 133, 131, 128, 126, 123, 121, 119, 116, 114, 112, 109, 107, 105, 102, 100, 98, 95, 93, 91, 88, 86, 84, 81, 79, 77, 74, 72, 70, 67, 65, 63, 60, 58, 56, 53, 51, 49, 46, 44, 42, 39, 37, 35, 32, 30, 28, 25, 23, 21, 18, 16, 14, 11, 9, 7, 4, 0];
var pulsingRate = 1.0;
var previousStep = -1;


//Functions
// function findValuePosition(value, obj) {
//   for (const prop in obj) {
//     if (Array.isArray(obj[prop])) {
//       for (let i = 0; i < obj[prop].length; i++) {
//         for (let j = 0; j < obj[prop][i].length; j++) {
//           if (JSON.stringify(obj[prop][i][j]) === JSON.stringify(value)) {
//             return {
//               property: prop,
//               arrayIndex: i,
//               elementIndex: j
//             };
//           }
//         }
//       }
//     } else if (typeof obj[prop] === 'object') {
//       const result = findValuePosition(value, obj[prop]);
//       if (result) {
//         return result;
//       }
//     }
//   }
//   return null;
// }

// const valueToFind = [1, 50];
// const position = findValuePosition(valueToFind, notes);

// if (position) {
//   console.log(`Value found in ${position.property} at index [${position.arrayIndex}][${position.elementIndex}]`);
// } else {
//   console.log('Value not found in the object.');
// }


// User Functions 
function setMidiMode()
{
	// local.sendSysex(0x00, 0x20, 0x29, 0x02, 0x0D, 0x0E, 0x01);
	local.sendSysex(0x47, 0x7F, 0x29, 0x60, 0x00, 0x04, 0x41, 0x08, 0x02, 0x01);
	script.log("Set Midi Mode with Sysex Message");
}


function setLed(led, red, green, flashRed, flashGreen)
{
	local.sendNoteOn(1, led+96, red + ((1-flashRed) << 2) + (green << 4) + ((1-flashGreen << 6))); 
}

function setEncoderMode(top, id)
{
	// TODO: Set Encoder Mode with Midi Message
} 

function setRGB(xId, yId)
{
	// TODO: Send Sysex Message with RGB Data
}


//Commands


function setPadColor(pad, colors, flashing)
{
	setLed(pad, colors[0], colors[1], flashing, flashing);
}

function resetColors()
{
	for(var i=0;i<16;i++) setLed(0,0,0,0);
}

// Init
function init()
{
	// Generate Note to Object Matrix
	// Faders
	for (var i = 0; i <= 9; i++)
	{
		var note = ccNotes.faders[i];
		// let name = `Fader ${i}`;
		var name = "fader" + (i+1) + "";
		if (i == 9)
		{
			name = "faderAb";
		}
		
		ccValueObj[note[0]][note[1]] = local.values.faders.getChild(name);
	}

	// Encoders
	for (var i = 0; i < 8; i++)
	{
		var noteTop = ccNotes.encoders.top[i];
		var noteSide = ccNotes.encoders.side[i];
		var nameTop = "encoderTop" + (i+1) + "";
		var nameSide = "encoderSide" + (i+1) + "";
		script.log("Note: " + noteTop[0] + " " + noteTop[1] + " Name: " + nameTop);
		
		ccValueObj[noteTop[0]][noteTop[1]] = local.values.encoders.getChild(nameTop);
		ccValueObj[noteSide[0]][noteSide[1]] = local.values.encoders.getChild(nameSide);
	}
	// Special Encoders
	ccValueObj[ccNotes.encoders.cue[0]][ccNotes.encoders.cue[1]] = local.values.encoders.getChild("encoderCueLevel");
	ccValueObj[ccNotes.encoders.tempo[0]][ccNotes.encoders.tempo[1]] = local.values.encoders.getChild("encoderTempo");
}

// Events

function moduleParameterChanged(param)
{
	if(param.getParent().name == "padColors")
	{
		var id = parseInt(param.name.substring(3));
		var val = param.getData();
		setLed(id, val[0],val[1], 0, 0);
	}
}


function noteOnEvent(channel, pitch, velocity)
{
	script.log("Note on received "+channel+", "+pitch+", "+velocity);
}


function noteOffEvent(channel, pitch, velocity)
{
	script.log("Note off received "+channel+", "+pitch+", "+velocity);
}

function ccEvent(channel, number, value)
{
	var obj = ccValueObj[channel][number];
	if (!!obj)
	{
		// script.log("Mapping for this Midi Note found");
		if(obj.name == "encoderCueLevel" || obj.name == "encoderTempo")
		{
			if (value > 63) value = value - 128;
			obj.set(value);
		}
		else
		{
			obj.set((value/127));
		}
	}
	else
	{
		script.log("No Mapping for this Midi Note found");
	}

	script.log("ControlChange received "+channel+", "+number+", "+value);
}

function sysExEvent(data)
{
	script.log("Sysex Message received, "+data.length+" bytes :");
}