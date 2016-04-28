'use strict';
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var CryptoJS = require("crypto-js");
var config = require('./config/beta/configurations.json');

var http = express();
var port = config.port;

http.use(bodyParser.json());

function verifyRequest(req, res, next) {
	// Refer to https://developers.line.me/businessconnect/development-bot-server#signature_validation
	var channelSignature = req.get('X-LINE-ChannelSignature');
	var sha256 = CryptoJS.HmacSHA256(JSON.stringify(req.body), config.channelSecret);
	var base64encoded = CryptoJS.enc.Base64.stringify(sha256);
	if (base64encoded === channelSignature) {
		next();
	} else {
		res.status(470).end();
	}
}

http.post('/events', verifyRequest, function(req, res) {
	var result = req.body.result;
	if (!result || !result.length || !result[0].content) {
		res.status(470).end();
		return;
	}
	res.status(200).end();

	// One request may have serveral contents in an array.
	var content = result[0].content;
	// mid
	var from = content.from;
	// Content type would be possibly text/image/video/audio/gps/sticker/contact.
	var type = content.contentType;
	// assume it's text type here.
	var text = content.text;

	// Refer to https://developers.line.me/businessconnect/api-reference#sending_message
	sendMsg(from, {
		contentType: 1,
		toType: 1,
		text: 'respond'
	}, function(err) {
		if (err) {
			// sending message failed
			return;
		}
		// message sent
	});
});

function sendMsg(who, content, callback) {
	var data = {
		to: [who],
		toChannel: config.eventToChannelId,
		eventType: config.eventType,
		content: content
	};

	request({
		method: 'POST',
		// https://api.line.me
		url: config.channelUrl + '/v1/events',
		headers: {
			'Content-Type': 'application/json',
			'X-LINE-ChannelToken': config.channelToken
		},
		json: data
	}, function(err, res, body) {
		if (err) {
			callback(err);
		} else {
			callback();
		}
	});
}

http.listen(port);
