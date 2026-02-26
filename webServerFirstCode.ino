/*  
  Rui Santos & Sara Santos - Random Nerd Tutorials
  https://RandomNerdTutorials.com/esp32-web-server-beginners-guide/
  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files.
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

#include <WiFi.h>
#include <WebServer.h>

// Wi-Fi credentials
const char* ssid = "EngineeringSubNet";
const char* password = "password";

// Assign output variables to GPIO pins
const int output5 = 5;
const int output13 = 13;
String output5State = "off";
String output13State = "off";

// Create a web server object
WebServer server(80);


void setup() {
  Serial.begin(115200);

  // Initialize the output variables as outputs
  pinMode(output5, OUTPUT);
  pinMode(output13, OUTPUT);
  // Set outputs to LOW
  digitalWrite(output5, LOW);
  digitalWrite(output13, LOW);

  // Connect to Wi-Fi network
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  // Set up the web server to handle different routes
  server.on("/", handleRoot);
  server.on("/5/on", handleGPIO5On);
  server.on("/5/off", handleGPIO5Off);
  server.on("/13/on", handleGPIO13On);
  server.on("/13/off", handleGPIO13Off);

  // Start the web server
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  // Handle incoming client requests
  server.handleClient();
}

void handleGPIO5On() {
  output5State = "on";
  digitalWrite(output5, HIGH);
  handleRoot();
}

// Function to handle turning GPIO 5 off
void handleGPIO5Off() {
  output5State = "off";
  digitalWrite(output5, LOW);
  handleRoot();
}

// Function to handle turning GPIO 13 on
void handleGPIO13On() {
  output13State = "on";
  digitalWrite(output13, HIGH);
  handleRoot();
}

// Function to handle turning GPIO 13 off
void handleGPIO13Off() {
  output13State = "off";
  digitalWrite(output13, LOW);
  handleRoot();
}

// Function to handle the root URL and show the current states
void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">";
  html += "<link rel=\"icon\" href=\"data:,\">";
  html += "<style>html { font-family: Helvetica; display: inline-block; margin: 0px auto; text-align: center;}";
  html += ".button { background-color: #4CAF50; border: none; color: white; padding: 16px 40px; text-decoration: none; font-size: 30px; margin: 2px; cursor: pointer;}";
  html += ".button2 { background-color: #555555; }</style></head>";
  html += "<body><h1>ESP32 Web Server</h1>";

  // Display GPIO 5 controls
  html += "<p>GPIO 5 - State " + output5State + "</p>";
  if (output5State == "off") {
    html += "<p><a href=\"/5/on\"><button class=\"button\">ON</button></a></p>";
  } else {
    html += "<p><a href=\"/5/off\"><button class=\"button button2\">OFF</button></a></p>";
  }

  // Display GPIO 13 controls
  html += "<p>GPIO 13 - State " + output13State + "</p>";
  if (output13State == "off") {
    html += "<p><a href=\"/13/on\"><button class=\"button\">ON</button></a></p>";
  } else {
    html += "<p><a href=\"/13/off\"><button class=\"button button2\">OFF</button></a></p>";
  }

  html += "</body></html>";
  server.send(200, "text/html", html);
}
