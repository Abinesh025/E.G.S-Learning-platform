import { useState, useCallback } from 'react';

/* ─── DATA ───────────────────────────────────────────────── */
const MENU = {
  arduino: [
    { label: "Getting Started", items: [
      { id: "what-is-arduino", label: "What is Arduino?" },
      { id: "modules", label: "Arduino Modules" },
      { id: "sensors", label: "Sensors & Actuators" },
      { id: "connectivity", label: "Connectivity" },
    ]},
    { label: "Installation", items: [
      { id: "install-windows", label: "Install on Windows" },
      { id: "install-linux", label: "Install on Linux" },
      { id: "install-macos", label: "Install on macOS" },
    ]},
    { label: "Projects", items: [
      { id: "projects-beginner", label: "Beginner Projects" },
      { id: "projects-intermediate", label: "Intermediate Projects" },
      { id: "projects-advanced", label: "Advanced Projects" },
    ]},
  ],
};

/* ─── PAGES DATA ─────────────────────────────────────────── */
const PAGES = {
  home: null,
  tutorials: null,

  "what-is-arduino": {
    title: "What is Arduino?",
    badge: { label: "Arduino", cls: "tag-arduino" },
    level: { label: "Beginner", cls: "tag-beginner" },
    content: () => (
      <div className="space-y-6 page-fade">
        <p className="text-slate-300 text-base leading-relaxed font-body">
          Arduino is an open-source electronics platform combining easy-to-use hardware and software.
          It's designed for anyone making interactive projects — artists, designers, hobbyists, and students.
        </p>
        <InfoBox color="indigo" icon="💡" title="Key Insight">
          Arduino boards read inputs — light on a sensor, a finger on a button — and turn them into outputs,
          like activating a motor or turning on an LED. All this by sending instructions via the Arduino IDE.
        </InfoBox>
        <h2 className="text-white font-semibold text-lg mt-8 font-display">Core Components</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name:"Microcontroller", desc:"ATmega328P chip that executes your code", icon:"🔲"},
            { name:"Digital Pins", desc:"14 I/O pins for sensors and modules", icon:"📡"},
            { name:"Analog Pins", desc:"6 ADC pins for analog sensor readings", icon:"〰️"},
            { name:"USB Interface", desc:"For programming and serial communication", icon:"🔌"},
          ].map(c => (
            <div key={c.name} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex gap-3">
              <span className="text-xl shrink-0">{c.icon}</span>
              <div>
                <p className="text-white font-medium text-sm font-display">{c.name}</p>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <h2 className="text-white font-semibold text-lg mt-6 font-display">Your First Sketch</h2>
        <CodeBlock code={`void setup() {
  pinMode(LED_BUILTIN, OUTPUT); // Set pin 13 as output
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH); // Turn LED on
  delay(1000);                      // Wait 1 second
  digitalWrite(LED_BUILTIN, LOW);  // Turn LED off
  delay(1000);                      // Wait 1 second
}`} lang="cpp"/>
      </div>
    )
  },

  "modules": {
    title: "Arduino Modules",
    badge: { label: "Arduino", cls: "tag-arduino" },
    level: { label: "Beginner", cls: "tag-beginner" },
    content: () => (
      <div className="space-y-6 page-fade">
        <p className="text-slate-300 text-base leading-relaxed font-body">
          Modules extend Arduino's capabilities. From wireless communication to motor control,
          these plug-and-play shields and breakouts unlock a vast IoT ecosystem.
        </p>
        <div className="space-y-3">
          {[
            { name:"L298N Motor Driver", desc:"Controls up to 2 DC motors or 1 stepper motor with PWM speed control.", color:"bg-cyan-500/10 border-cyan-500/20 text-cyan-300"},
            { name:"HC-05 Bluetooth", desc:"Classic Bluetooth serial module for wireless data transfer up to 10m.", color:"bg-blue-500/10 border-blue-500/20 text-blue-300"},
            { name:"NRF24L01 Radio", desc:"2.4GHz transceiver for low-power mesh networking between Arduinos.", color:"bg-indigo-500/10 border-indigo-500/20 text-indigo-300"},
            { name:"SD Card Module", desc:"Store sensor logs and read config files via SPI interface.", color:"bg-emerald-500/10 border-emerald-500/20 text-emerald-300"},
            { name:"OLED Display", desc:"128×64 I2C/SPI display for real-time data visualization.", color:"bg-purple-500/10 border-purple-500/20 text-purple-300"},
          ].map(m => (
            <div key={m.name} className={`border rounded-xl p-4 ${m.color}`}>
              <p className="font-mono font-medium text-sm">{m.name}</p>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },

  "sensors": {
    title: "Sensors & Actuators",
    badge: { label: "Arduino", cls: "tag-arduino" },
    level: { label: "Beginner", cls: "tag-beginner" },
    content: () => (
      <div className="space-y-6 page-fade">
        <p className="text-slate-300 text-base leading-relaxed font-body">
          Sensors are the senses of your IoT device — they gather data from the physical world.
          Actuators are the muscles — they act on that data.
        </p>
        <SectionTable
          headers={["Sensor", "Type", "Protocol", "Range"]}
          rows={[
            ["DHT22","Temperature & Humidity","Digital","−40–80°C"],
            ["HC-SR04","Ultrasonic Distance","Digital","2cm–4m"],
            ["PIR (HC-SR501)","Motion Detection","Digital","3–7m"],
            ["BMP280","Barometric Pressure","I2C/SPI","300–1100 hPa"],
            ["LDR","Light Intensity","Analog","N/A"],
            ["MQ-2","Gas / Smoke","Analog","300–10000 ppm"],
          ]}
        />
        <h2 className="text-white font-semibold text-lg font-display">Reading a DHT22</h2>
        <CodeBlock code={`#include <DHT.h>
#define DHTPIN 2
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  Serial.print("Temp: "); Serial.print(t);
  Serial.print("°C  Humidity: "); Serial.println(h);
  delay(2000);
}`} lang="cpp"/>
      </div>
    )
  },

  "connectivity": {
    title: "Connectivity",
    badge: { label: "Arduino", cls: "tag-arduino" },
    level: { label: "Intermediate", cls: "tag-intermediate" },
    content: () => (
      <div className="space-y-6 page-fade">
        <p className="text-slate-300 text-base leading-relaxed font-body">
          Connecting Arduino to networks and the cloud is the core of IoT. Choose the right
          protocol for your range, power, and data requirements.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label:"Wi-Fi", module:"ESP8266 / ESP32", range:"~50m indoor", power:"High", icon:"📶"},
            { label:"Bluetooth", module:"HC-05 / HC-06", range:"~10m", power:"Medium", icon:"🔵"},
            { label:"LoRa", module:"SX1278", range:"~10km", power:"Low", icon:"📡"},
          ].map(c => (
            <div key={c.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="text-2xl mb-2">{c.icon}</div>
                <p className="text-white font-semibold font-display">{c.label}</p>
                <p className="text-indigo-400 text-xs font-mono mt-1">{c.module}</p>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-slate-400 text-xs">Range: <span className="text-slate-200">{c.range}</span></p>
                <p className="text-slate-400 text-xs">Power: <span className="text-slate-200">{c.power}</span></p>
              </div>
            </div>
          ))}
        </div>
        <InfoBox color="amber" icon="⚡" title="MQTT Protocol">
          For IoT cloud connectivity, MQTT is the lightweight pub/sub protocol of choice.
          Libraries like PubSubClient make it trivial to publish sensor data to brokers like HiveMQ or Mosquitto.
        </InfoBox>
      </div>
    )
  },

  "install-windows": {
    title: "Install on Windows",
    badge: { label: "Arduino", cls: "tag-arduino" },
    level: { label: "Beginner", cls: "tag-beginner" },
    content: () => <InstallPage os="Windows" steps={[
      { n:1, title:"Download Arduino IDE", desc:"Visit arduino.cc/en/software and download the Windows Installer (.exe). Choose the latest stable release." },
      { n:2, title:"Run the Installer", desc:"Double-click the .exe file. Accept the license, select components (keep defaults), and choose the installation path." },
      { n:3, title:"Install USB Drivers", desc:"The installer automatically installs CH340/CH341 drivers. Windows may prompt for driver installation — allow it." },
      { n:4, title:"Launch & Configure", desc:"Open Arduino IDE, go to Tools → Board → Arduino AVR Boards → Arduino Uno. Set the correct COM port under Tools → Port." },
      { n:5, title:"Verify with Blink", desc:"Open File → Examples → 01.Basics → Blink, then click Upload. The built-in LED should blink every second." },
    ]}/>
  },

  "install-linux": {
    title: "Install on Linux",
    badge: { label: "Arduino", cls: "tag-arduino" },
    level: { label: "Beginner", cls: "tag-beginner" },
    content: () => (
      <div className="space-y-6 page-fade">
        <p className="text-slate-300 text-base leading-relaxed font-body">
          Arduino IDE runs natively on Linux. You'll also need to add yourself to the <code className="text-cyan-400 font-mono text-sm">dialout</code> group for serial port access.
        </p>
        <InstallPage os="Linux" steps={[
          { n:1, title:"Download AppImage", desc:"Download the Linux AppImage from arduino.cc/en/software. It works on any modern distro without installation." },
          { n:2, title:"Make Executable", desc:"Right-click → Properties → Permissions → Allow executing, or run chmod +x in terminal." },
          { n:3, title:"Add to dialout group", desc:"Run the command below in terminal, then log out and back in for changes to take effect." },
          { n:4, title:"Launch IDE", desc:"Double-click the AppImage to launch. Select your board under Tools → Board Manager." },
        ]}/>
        <CodeBlock code={`# Add user to dialout group for serial access
sudo usermod -a -G dialout $USER

# Verify the AppImage is executable
chmod +x arduino-ide_*.AppImage

# Launch
./arduino-ide_*.AppImage`} lang="bash"/>
      </div>
    )
  },

  "install-macos": {
    title: "Install on macOS",
    badge: { label: "Arduino", cls: "tag-arduino" },
    level: { label: "Beginner", cls: "tag-beginner" },
    content: () => <InstallPage os="macOS" steps={[
      { n:1, title:"Download .dmg", desc:"Visit arduino.cc/en/software and download the macOS .dmg for Apple Silicon or Intel as appropriate." },
      { n:2, title:"Install the App", desc:"Open the .dmg and drag Arduino IDE to your Applications folder." },
      { n:3, title:"Allow in Security Settings", desc:"On first launch, macOS may block it. Go to System Preferences → Security & Privacy → Open Anyway." },
      { n:4, title:"Install CH340 Drivers", desc:"For Chinese Arduino clones, install CH34x drivers from wch.cn separately." },
      { n:5, title:"Select Board & Port", desc:"Under Tools, select your board and the /dev/cu.usbserial-* or /dev/cu.wchusbserial-* port." },
    ]}/>
  },

  "projects-beginner": {
    title: "Beginner Projects",
    badge: { label: "Arduino", cls: "tag-arduino" },
    level: { label: "Beginner", cls: "tag-beginner" },
    content: () => <ProjectsPage level="Beginner" projects={[
      { name:"LED Blink", time:"15 min", parts:["Arduino Uno","LED","220Ω resistor"], desc:"The classic Hello World of electronics. Control an LED's timing with digitalWrite and delay." },
      { name:"Push Button Counter", time:"20 min", parts:["Arduino","Push button","10kΩ resistor","Serial Monitor"], desc:"Count button presses and display via Serial Monitor. Introduces digitalRead and debouncing." },
      { name:"Potentiometer Dimmer", time:"20 min", parts:["Arduino","Potentiometer","LED"], desc:"Read analog voltage and use it to control LED brightness via PWM with analogWrite." },
      { name:"Temperature Monitor", time:"30 min", parts:["Arduino","DHT11 sensor","Serial Monitor"], desc:"Read real temperature data and print it every 2 seconds. Introduces sensor libraries." },
    ]}/>
  },

  "projects-intermediate": {
    title: "Intermediate Projects",
    badge: { label: "Arduino", cls: "tag-arduino" },
    level: { label: "Intermediate", cls: "tag-intermediate" },
    content: () => <ProjectsPage level="Intermediate" projects={[
      { name:"OLED Weather Station", time:"1 hr", parts:["Arduino","BME280","0.96\" OLED","Wires"], desc:"Display live temperature, humidity, and pressure on an OLED screen with a clean UI layout." },
      { name:"IR Remote Control", time:"45 min", parts:["Arduino","IR receiver","IR remote","LEDs"], desc:"Decode IR signals from any TV remote and map buttons to Arduino actions." },
      { name:"Ultrasonic Parking Sensor", time:"45 min", parts:["Arduino","HC-SR04","Buzzer","LEDs"], desc:"Measure distance and warn with increasing buzzer frequency as objects approach." },
      { name:"Servo Sweep with Potentiometer", time:"30 min", parts:["Arduino","SG90 servo","Potentiometer"], desc:"Map potentiometer angle to servo position for precise mechanical control." },
    ]}/>
  },

  "projects-advanced": {
    title: "Advanced Projects",
    badge: { label: "Arduino", cls: "tag-arduino" },
    level: { label: "Advanced", cls: "tag-advanced" },
    content: () => <ProjectsPage level="Advanced" projects={[
      { name:"MQTT IoT Dashboard", time:"3 hrs", parts:["Arduino + ESP8266","DHT22","Node-RED","Mosquitto broker"], desc:"Publish sensor data over Wi-Fi to an MQTT broker, visualize in a Node-RED dashboard in real time." },
      { name:"Self-Balancing Robot", time:"6 hrs", parts:["Arduino Uno","MPU-6050 IMU","L298N motor driver","DC motors"], desc:"Implement a PID controller using gyroscope data to keep a two-wheeled robot balanced." },
      { name:"RFID Access Control", time:"2 hrs", parts:["Arduino","RC522 RFID","Relay module","Solenoid lock"], desc:"Build a door access system that reads RFID cards, checks an allow-list, and triggers a relay." },
      { name:"CAN Bus Logger", time:"4 hrs", parts:["Arduino Mega","MCP2515 CAN module","SD card module","LCD"], desc:"Tap into a vehicle's OBD-II port, log CAN frames to SD card, and display live PIDs." },
    ]}/>
  },
};

/* ─── REUSABLE UI COMPONENTS ──────────────────────────────── */
function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="code-block relative group my-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50">
        <span className="text-xs font-mono text-slate-500">{lang}</span>
        <button
          type="button"
          onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),1500); }}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-mono flex items-center gap-1"
        >
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-slate-300"><code>{code}</code></pre>
    </div>
  );
}

function InfoBox({ color, icon, title, children }) {
  const colors = {
    indigo: "bg-indigo-500/10 border-indigo-500/25 text-indigo-300",
    amber: "bg-amber-500/10 border-amber-500/25 text-amber-300",
    emerald: "bg-emerald-500/10 border-emerald-500/25 text-emerald-300",
    cyan: "bg-cyan-500/10 border-cyan-500/25 text-cyan-300",
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[color] || colors.indigo}`}>
      <p className="font-semibold text-sm mb-1 font-display">{icon} {title}</p>
      <p className="text-slate-300 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function SectionTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800/80">
            {headers.map(h => <th key={h} className="text-left px-4 py-2.5 font-mono text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i%2===0?"bg-slate-900":"bg-slate-800/30"}>
              {row.map((cell,j) => <td key={j} className={`px-4 py-2.5 ${j===0?"text-white font-medium":"text-slate-400"}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InstallPage({ os, steps }) {
  return (
    <div className="space-y-4 page-fade">
      <p className="text-slate-300 text-base leading-relaxed">Follow these steps to set up Arduino IDE on {os}.</p>
      <div className="space-y-3">
        {steps.map(s => (
          <div key={s.n} className="flex gap-4 bg-slate-900 border border-slate-700 rounded-xl p-4">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-indigo-400 font-mono text-xs font-semibold">{s.n}</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm font-display">{s.title}</p>
              <p className="text-slate-400 text-sm mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsPage({ level, projects }) {
  const levelColors = { Beginner:"tag-beginner", Intermediate:"tag-intermediate", Advanced:"tag-advanced" };
  return (
    <div className="space-y-4 page-fade">
      <p className="text-slate-300 text-base leading-relaxed">
        Hands-on {level.toLowerCase()} projects to build real IoT experience.
      </p>
      <div className="grid gap-4">
        {projects.map(p => (
          <div key={p.name} className="bg-slate-900 border border-slate-700 rounded-xl p-5 card-glow transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-white font-semibold font-display text-[15px]">{p.name}</h3>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <span className={`badge ${levelColors[level]}`}>{level}</span>
                <span className="badge bg-slate-700/60 text-slate-300 border border-slate-600">{p.time}</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-3">{p.desc}</p>
            <div className="flex flex-wrap gap-2">
              {p.parts.map(pt => <span key={pt} className="text-xs font-mono bg-slate-800 text-slate-400 border border-slate-600/50 rounded px-2 py-0.5">{pt}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── ACCORDION MENU ──────────────────────────────────────── */
function AccordionGroup({ group, activePage, onNavigate }) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold uppercase tracking-widest font-mono transition-colors"
      >
        <span>{group.label}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <div className={`accordion-content transition-all duration-300 overflow-hidden ${open ? "max-h-96 opacity-100 py-1" : "max-h-0 opacity-0 pointer-events-none"}`}>
        {group.items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`sidebar-link w-full text-left px-5 py-1.5 text-sm rounded mx-1 mb-0.5 ${activePage===item.id ? "active" : "text-slate-400"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── SIDEBAR ─────────────────────────────────────────────── */
function Sidebar({ activePage, onNavigate, platform }) {
  const menu = MENU[platform] || [];
  return (
    <nav className="h-full overflow-y-auto py-4 bg-slate-950 border-r border-slate-800/80">
      <div className="px-3 mb-4">
        <button
          type="button"
          onClick={() => onNavigate("tutorials")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-mono transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          All Categories
        </button>
      </div>
      <div className="px-3 mb-4 pb-4 border-b border-slate-800">
        <p className="text-indigo-400 font-semibold text-sm flex items-center gap-2 font-display">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
          Arduino
        </p>
      </div>
      <div className="space-y-1">
        {menu.map(group => (
          <AccordionGroup key={group.label} group={group} activePage={activePage} onNavigate={onNavigate}/>
        ))}
      </div>
    </nav>
  );
}

/* ─── HEADER ──────────────────────────────────────────────── */
function Header({ page, onNavigate, sidebarOpen, setSidebarOpen, showSidebarToggle }) {
  return (
    <header className="nav-glass h-14 flex items-center px-4 gap-4 bg-slate-900/90 border-b border-slate-800 rounded-t-2xl">
      {showSidebarToggle && (
        <button
          type="button"
          onClick={() => setSidebarOpen(o=>!o)}
          className="lg:hidden text-slate-400 hover:text-white p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      )}
      <button type="button" onClick={() => onNavigate("home")} className="flex items-center gap-2.5 font-semibold text-white group">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-sm font-mono font-display">⟨/⟩</div>
        <span className="text-sm font-semibold tracking-tight font-display">IoT<span className="text-indigo-400">Tutorials</span></span>
      </button>
      <div className="flex-1"/>
      <nav className="flex items-center gap-1">
        {[
          { id:"home", label:"Home" },
          { id:"tutorials", label:"Tutorials" },
        ].map(n => (
          <button
            key={n.id}
            type="button"
            onClick={() => onNavigate(n.id)}
            className={`px-3 py-1.5 rounded text-sm transition-colors font-display ${page===n.id||page.startsWith(n.id) ? "text-white bg-slate-800" : "text-slate-400 hover:text-white hover:bg-slate-800/60"}`}
          >
            {n.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

/* ─── HOME PAGE ───────────────────────────────────────────── */
function HomePage({ onNavigate }) {
  return (
    <div className="page-fade">
      {/* Hero */}
      <div className="hero-grid border-b border-slate-800/80 px-6 py-20 text-center rounded-t-2xl">
        <div className="max-w-2xl mx-auto">
          <span className="badge bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6 inline-block font-mono">Open-source IoT Education</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-4 font-display">
            Learn IoT from
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400"> first principles</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8 font-body">
            Comprehensive tutorials for Arduino, Raspberry Pi, and ESP32 — from blinking an LED
            to deploying full IoT cloud systems.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => onNavigate("what-is-arduino")}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors font-display"
            >
              Start Learning
            </button>
            <button
              type="button"
              onClick={() => onNavigate("tutorials")}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg border border-slate-600 transition-colors font-display"
            >
              Browse All Tutorials
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border-b border-slate-800 divide-x divide-slate-800">
        {[
          { n:"12+", label:"Tutorials" },
          { n:"3", label:"Platforms" },
          { n:"Free", label:"Always" },
        ].map(s => (
          <div key={s.n} className="py-8 text-center bg-slate-900/20">
            <p className="text-2xl font-bold text-white font-mono">{s.n}</p>
            <p className="text-slate-500 text-sm mt-1 leading-relaxed font-body">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="px-6 py-14 max-w-4xl mx-auto">
        <h2 className="text-white text-2xl font-semibold mb-2 text-center font-display">What you'll learn</h2>
        <p className="text-slate-500 text-center mb-10 text-sm font-body">Structured curricula designed for all skill levels</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon:"⚙️", title:"Hardware Fundamentals", desc:"Microcontrollers, sensors, modules, and the physical layer of IoT devices.", color:"border-cyan-500/20 hover:border-cyan-500/40" },
            { icon:"💻", title:"Firmware & Code", desc:"C/C++ for Arduino, Python for RPi, and MicroPython for ESP32.", color:"border-indigo-500/20 hover:border-indigo-500/40" },
            { icon:"☁️", title:"Cloud & Networking", desc:"MQTT, HTTP APIs, Node-RED dashboards, and cloud platform integrations.", color:"border-purple-500/20 hover:border-purple-500/40" },
          ].map(f => (
            <div key={f.title} className={`bg-slate-900 border rounded-xl p-6 transition-all duration-300 card-glow ${f.color}`}>
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2 font-display">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-body">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Latest */}
      <div className="px-6 pb-16 max-w-4xl mx-auto">
        <h2 className="text-white text-xl font-semibold mb-6 font-display">Quick start paths</h2>
        <div className="grid gap-3">
          {[
            { label:"Complete beginner", path:"what-is-arduino", desc:"Start here if you've never used a microcontroller." },
            { label:"Already know basics", path:"projects-intermediate", desc:"Jump straight to intermediate projects." },
            { label:"Want cloud IoT", path:"connectivity", desc:"Learn MQTT, Wi-Fi, and cloud connectivity." },
          ].map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => onNavigate(p.path)}
              className="flex items-center justify-between bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg px-5 py-4 text-left transition-all group"
            >
              <div>
                <p className="text-white font-medium text-sm font-display">{p.label}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed font-body">{p.desc}</p>
              </div>
              <svg className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── TUTORIALS INDEX ─────────────────────────────────────── */
function TutorialsPage({ onNavigate }) {
  return (
    <div className="page-fade max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2 font-display">Tutorials</h1>
      <p className="text-slate-400 mb-10 font-body">Choose a platform to get started.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { id:"arduino", label:"Arduino", tag:"tag-arduino", icon:"🔵", desc:"Open-source microcontroller platform. Perfect for beginners and rapid prototyping.", topics:["Digital/Analog I/O","Sensors & Modules","C++ Programming","IoT Connectivity"], status:"available" },
          { id:"raspberry-pi", label:"Raspberry Pi", tag:"tag-rpi", icon:"🍓", desc:"Single-board Linux computer. Ideal for complex IoT hubs and edge processing.", topics:["Linux & Python","GPIO Interface","Node-RED","Cloud Services"], status:"coming" },
          { id:"esp32", label:"ESP32", tag:"tag-esp", icon:"📡", desc:"Dual-core Wi-Fi + Bluetooth SoC. Best for production IoT firmware.", topics:["MicroPython / C++","BLE & Wi-Fi","Deep Sleep","FreeRTOS"], status:"coming" },
        ].map(p => (
          <div
            key={p.id}
            onClick={() => p.status==="available" && onNavigate("what-is-arduino")}
            className={`bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col gap-4 card-glow transition-all duration-300 ${p.status==="available" ? "cursor-pointer hover:border-indigo-500/40" : "opacity-60"}`}
          >
            <div className="flex items-start justify-between">
              <div className="text-4xl">{p.icon}</div>
              {p.status === "coming" && (
                <span className="badge bg-slate-700 text-slate-400 border border-slate-600 font-mono">Soon</span>
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg font-display">{p.label}</h3>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed font-body">{p.desc}</p>
            </div>
            <ul className="space-y-1 mt-auto">
              {p.topics.map(t => (
                <li key={t} className="flex items-center gap-2 text-xs text-slate-500 font-body">
                  <span className="w-1 h-1 rounded-full bg-slate-600 inline-block flex-shrink-0"/>
                  {t}
                </li>
              ))}
            </ul>
            {p.status === "available" && (
              <div className="flex items-center gap-1 text-indigo-400 text-xs font-medium mt-1 font-display">
                Start Learning
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── TUTORIAL CONTENT LAYOUT ─────────────────────────────── */
function TutorialContentPage({ pageId, pages, onNavigate }) {
  const pageData = PAGES[pageId];
  if (!pageData) return null;
  const Content = pageData.content;

  // Next / prev
  const flat = pages.flatMap(g => g.items);
  const idx = flat.findIndex(i => i.id === pageId);
  const prev = idx > 0 ? flat[idx-1] : null;
  const next = idx < flat.length-1 ? flat[idx+1] : null;

  return (
    <article className="max-w-3xl py-8 px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`badge ${pageData.badge.cls} font-mono`}>{pageData.badge.label}</span>
        <span className={`badge ${pageData.level.cls} font-mono`}>{pageData.level.label}</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 leading-tight font-display">{pageData.title}</h1>
      <Content/>
      {/* Pagination */}
      <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-800">
        {prev ? (
          <button type="button" onClick={()=>onNavigate(prev.id)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors group font-display">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            <span>{prev.label}</span>
          </button>
        ) : <div/>}
        {next ? (
          <button type="button" onClick={()=>onNavigate(next.id)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors group font-display">
            <span>{next.label}</span>
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        ) : <div/>}
      </div>
    </article>
  );
}

/* ─── MAIN EXPORT COMPONENT ───────────────────────────────── */
export default function EEE() {
  const [page, setPage] = useState("home");
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const isTutorialPage = page !== "home" && page !== "tutorials";
  const navigate = useCallback((id) => {
    setPage(id);
    setMobileSidebar(false);
    // Scroll content container or window
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950/40 text-slate-200 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-body m-4 max-w-7xl mx-auto">
      {/* Embedded Custom Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar-link { transition: all 0.15s ease; }
        .sidebar-link:hover { background: rgba(99,102,241,0.1); color: #a5b4fc; }
        .sidebar-link.active { background: rgba(99,102,241,0.15); color: #818cf8; border-left: 2px solid #6366f1; }
        .accordion-content { overflow: hidden; transition: max-height 0.3s ease; }
        .code-block { background: #0d1422; border: 1px solid #243052; border-radius: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; line-height: 1.7; }
        .badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 500; font-family: 'IBM Plex Mono', monospace; letter-spacing: 0.02em; }
        .card-glow:hover { box-shadow: 0 0 30px rgba(99,102,241,0.12); }
        .nav-glass { background: rgba(10,15,30,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(99,102,241,0.15); }
        .page-fade { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .hero-grid { background-image: linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px); background-size: 40px 40px; }
        .tag-arduino { background: rgba(34,211,238,0.1); color: #67e8f9; border: 1px solid rgba(34,211,238,0.2); }
        .tag-rpi { background: rgba(236,72,153,0.1); color: #f9a8d4; border: 1px solid rgba(236,72,153,0.2); }
        .tag-esp { background: rgba(245,158,11,0.1); color: #fcd34d; border: 1px solid rgba(245,158,11,0.2); }
        .tag-beginner { background: rgba(16,185,129,0.1); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.2); }
        .tag-intermediate { background: rgba(245,158,11,0.1); color: #fcd34d; border: 1px solid rgba(245,158,11,0.2); }
        .tag-advanced { background: rgba(239,68,68,0.1); color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }
        .sidebar-section { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #4a5568; padding: 0.75rem 1rem 0.25rem; font-family: 'IBM Plex Mono', monospace; }
        .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 40; }
      `}} />

      <Header
        page={page}
        onNavigate={navigate}
        sidebarOpen={mobileSidebar}
        setSidebarOpen={setMobileSidebar}
        showSidebarToggle={isTutorialPage}
      />

      <div>
        {/* MOBILE SIDEBAR OVERLAY */}
        {isTutorialPage && mobileSidebar && (
          <>
            <div className="mobile-overlay lg:hidden" onClick={() => setMobileSidebar(false)}/>
            <div className="fixed top-14 left-0 bottom-0 w-64 bg-slate-950 border-r border-slate-800 z-50 lg:hidden overflow-y-auto">
              <Sidebar activePage={page} onNavigate={navigate} platform="arduino"/>
            </div>
          </>
        )}

        {/* MAIN CONTENT */}
        {page === "home" && <HomePage onNavigate={navigate}/>}
        {page === "tutorials" && <TutorialsPage onNavigate={navigate}/>}
        {isTutorialPage && (
          <div className="flex min-h-screen">
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden lg:block w-60 xl:w-64 flex-shrink-0 border-r border-slate-800/80 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto">
              <Sidebar activePage={page} onNavigate={navigate} platform="arduino"/>
            </aside>
            {/* CONTENT */}
            <main className="flex-1 min-w-0 bg-slate-950/20">
              <TutorialContentPage
                pageId={page}
                pages={MENU.arduino}
                onNavigate={navigate}
              />
            </main>
          </div>
        )}
      </div>

      {/* FOOTER */}
      {(page === "home" || page === "tutorials") && (
        <footer className="border-t border-slate-800/60 px-6 py-8 text-center bg-slate-950/40">
          <p className="text-slate-600 text-xs font-mono">IoTTutorials — Open-source learning for the maker community</p>
        </footer>
      )}
    </div>
  );
}