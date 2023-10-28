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
			[[1,32], [1,33], [1,34], [1,35], [1,36], [1,37], [1,38], [1,39], [1,82]],
			[[1,24], [1,25], [1,26], [1,27], [1,28], [1,29], [1,30], [1,31], [1,83]],
			[[1,16], [1,17], [1,18], [1,19], [1,20], [1,21], [1,22], [1,23], [1,84]],
			[[1, 8], [1, 9], [1,10], [1,11], [1,12], [1,13], [1,14], [1,15], [1,85]],
			[[1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1,86]],
			[[1,52], [2,52], [3,52], [4,52], [5,52], [6,52], [7,52], [8,52], [1,81]],
			[[1,51], [2,51], [3,51], [4,51], [5,51], [6,51], [7,51], [8,51], [1,80]]
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
		top: {
			"pan": [1, 87],
			"sends": [1,88],
			"user": [1,89],

			"play": [1, 91],
			"record": [1, 93],
			"session": [1, 102],

			"metronome": [1, 90],
			"tapTempo": [1, 99],
			"nudgeMinus": [1, 100],
			"nudgePlus": [1, 101],
		},

		encoders: {
			"1DevicePrev": [1,58],
			"2DeviceNext": [1,59],
			"3BankPrev": [1,60],
			"4BankNext": [1,61],
			"5DevOnOff": [1,62],
			"6DevLock": [1,63],
			"7ClipDevView": [1,64],
			"8DetailView": [1,65],

			"shift": [1,98],
			"bank": [1,103]
		},
		bankSelect: {
			up: [1,94],
			down: [1,95],
			left: [1,97],
			right: [1,96]
		}
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


// User Functions 
function setMidiMode()
{
	local.sendSysex(0x47, 0x7F, 0x29, 0x60, 0x00, 0x04, 0x41, 0x08, 0x02, 0x01);
	script.log("Set Midi Mode with Sysex Message");
}

// Resent Values
function resendMidi()
{
	// Encoders
	for(var i = 0; i < 8; i++)
	{
		setEncoder(true, (i+1), local.values.encoders.getChild("encoderTop"+(i+1)).get());
		setEncoder(false, (i+1), local.values.encoders.getChild("encoderSide"+(i+1)).get());
		setEncoderMode(true, (i+1), local.parameters.encoderModes.getChild("encoderTop"+(i+1)+"Mode").get());
		setEncoderMode(false, (i+1), local.parameters.encoderModes.getChild("encoderSide"+(i+1)+"Mode").get());
	}
}

// Functions

function setLed(led, red, green, flashRed, flashGreen)
{
	local.sendNoteOn(1, led+96, red + ((1-flashRed) << 2) + (green << 4) + ((1-flashGreen << 6))); 
}

function setEncoder(top, index, value)
{
	var group = top ? "top":"side";
	var note = ccNotes.encoders[group][index - 1];
	local.sendCC(note[0], note[1], Math.round(value * 127));
	// script.log("Send Midi " + note[0] + " " + note[1] + " " + Math.round(value*127));
}

// Set Encoder Display Mode with Midi Message
function setEncoderMode(top, index, mode)
{
	var group = top ? "top":"side";
	var note = ccNotes.encoders[group][index - 1];
	local.sendCC(note[0], note[1]+8, mode);
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
	// Generate CC to Object Matrix
	// ------- Faders -------
	for (var i = 0; i <= 9; i++)
	{
		var note = ccNotes.faders[i];
		var name = "fader" + (i+1) + "";
		if (i == 9)
		{
			name = "faderAb";
		}
		
		ccValueObj[note[0]][note[1]] = local.values.faders.getChild(name);
	}

	// ------- Encoders --------
	for (var i = 0; i < 8; i++)
	{
		var noteTop = ccNotes.encoders.top[i];
		var noteSide = ccNotes.encoders.side[i];
		var nameTop = "encoderTop" + (i+1) + "";
		var nameSide = "encoderSide" + (i+1) + "";
		
		ccValueObj[noteTop[0]][noteTop[1]] = local.values.encoders.getChild(nameTop);
		ccValueObj[noteSide[0]][noteSide[1]] = local.values.encoders.getChild(nameSide);
	}
	// Special Encoders
	ccValueObj[ccNotes.encoders.cue[0]][ccNotes.encoders.cue[1]] = local.values.encoders.getChild("encoderCueLevel");
	ccValueObj[ccNotes.encoders.tempo[0]][ccNotes.encoders.tempo[1]] = local.values.encoders.getChild("encoderTempo");


	// Note to Object Matrix
	// ------- Pads ------
	// -- Main Pads --
	for (var row = 0; row < 7; row++)
	{
		for(var column = 0; column < 9; column++)
		{
			var note = noteNotes.pads.main[row][column];
			var name = "pad" + (row+1) + (column+1) + "";

			noteValueObj[note[0]][note[1]] = local.values.pads.main.getChild(name);
		}
	}

	// -- Fader Pads --
	var faderButtonNames = ["Select","Ab","Solo","Record"];
	for (var fader = 0; fader < 8; fader++)
	{
		for (var button = 0; button < 4; button++)
		{
			var note = noteNotes.pads.faders[fader][button];
			var name = "fader" + (fader + 1) + faderButtonNames[button];

			noteValueObj[note[0]][note[1]] = local.values.pads.faderButtons.getChild(name);
		}
	}

	// ------- Buttons --------
	// because there doesn't seem to be a way to iterate over object or getting the keys here a manual:
	var groups = ["top","encoders","bankSelect"];
	var keys = [
		["pan","sends","user","play","record","session","metronome","tapTempo","nudgePlus","nudgeMinus"],
		["1DevicePrev", "2DeviceNext", "3BankPrev", "4BankNext", "5DevOnOff", "6DevLock", "7ClipDevView", "8DetailView", "shift", "bank"],
		["up","down","left","right"]
	];

	for (var i = 0; i < groups.length; i++)
	{
		var group = groups[i];
		for (var k = 0; k < keys[i].length; k++)
		{
			var key = keys[i][k];
			var note = noteNotes.buttons[group][key];

			script.log(note[0] + note[1] + group + key);
			noteValueObj[note[0]][note[1]] = local.values.buttons.getChild(group).getChild(key);
			// noteValueObj[note[0]][note[1]] = local.values.buttons[group][key];
		}
	}
}
/*
	for (var i = 0; i < noteNotes.buttons.length; i++)
	{
		let groupKeys = noteNotes.buttons.keys();
		let groupKey = groupKeys[i];
		for (var j = 0; j < noteNotes.buttons[groupKey].length; j++);
		{
			let key = noteNotes.buttons[groupKey].keys()[j];
			let note = noteNotes.buttons[key];
			noteValueObj[note[0]][note[1]] = local.values.buttons.getChild(groupKey).getChild(key);
		}
	}

	for (let group in noteNotes.buttons)
	{
		for (let key in noteNotes.buttons[group])	
		{
			if (noteNotes.buttons.hasOwnProperty(key))
			{
				let note = noteNotes.buttons[key]
				noteValueObj[note[0]][note[1]] = local.values.buttons.getChild(group).getChild(name);
			}
		}
	}
*/

// Handle Midi Inputs
function handleCC(channel, number, value)
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
		script.log("No Mapping for this Midi CC found");
	}
}

function handleNote(channel, note, velocity)
{
	var obj = noteValueObj[channel][note];
	if (!!obj)
	{
		obj.set((velocity == 127));
	}
	else
	{
		script.log("No Mapping for this Midi Note found");
	}

}

// Events

function moduleValueChanged(value)
{
	if(value.getParent().name == "encoders")
	{
		if (value.name.substring(7,10) == "Top")
		{
			var index = parseInt(value.name.charAt(10));
			setEncoder(true, index, value.get());

		}
		else if(value.name.substring(7,11) == "Side")
		{
			var index = parseInt(value.name.charAt(11));
			setEncoder(false, index, value.get());
		}
	}
}

function moduleParameterChanged(param)
{
	script.log("Parameter Changed: " + param.name);
	// Connection Midi Mode
	if (param.name == "devices") setMidiMode();
    if (param.name == "isConnected")
	{
        if (param.get() == 1)
		{
			setMidiMode();
		} 
    }

	if(param.getParent().name == "encoderModes")
	{
		if (param.name.substring(7,10) == "Top")
		{
			var index = parseInt(param.name.charAt(10));
			setEncoderMode(true, index, param.get());

		}
		else if(param.name.substring(7,11) == "Side")
		{
			var index = parseInt(param.name.charAt(11));
			setEncoderMode(false, index, param.get());
		}
	}
}


function noteOnEvent(channel, note, velocity)
{
	handleNote(channel, note, velocity);
}


function noteOffEvent(channel, note , velocity)
{
	handleNote(channel, note, velocity);
}

function ccEvent(channel, number, value)
{
	handleCC(channel, number, value);
}

function sysExEvent(data)
{
	script.log("Sysex Message received, "+data.length+" bytes :");
}