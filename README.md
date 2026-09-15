# **TCPing** 🚀
A lightweight TCP connection testing tool.

## **📌 Features**
- **Continuous TCP Pinging:** Keeps sending TCP connection attempts until interrupted.
- **Custom Protocols:** Supports basic "synack" as well as Minecraft client simulation protocols (MCv1, MCv2, FiveM..).
- **Input Validation:** Ensures proper IP and port formats before testing.
- **Colored Console Output:** Uses chalk for clear, color-coded messages.

---

## **📦 Installation**

### **1️⃣ Clone the project**
```sh
git clone https://github.com/yourusername/TCPing.git
cd TCPing
```

### **2️⃣ Install dependencies**
If you're using **pnpm**:
```sh
pnpm install
```
Otherwise, with **npm**:
```sh
npm install
```

---

---

## **⚙️ Configuration**

The tool accepts command-line arguments in the following format:
```sh
node app/main.js <target> <port> [protocol] [options]
# or if installed globally:
tcping <target> <port> [protocol] [options]
```

- **target:** Target IP address (IPv4/IPv6), domain name, or `localhost`.
- **port:** Target server port (1–65535).
- **protocol (optional):** The protocol to simulate (default: `basic`).
- **-r | --resolve:** Resolves domain name upfront to measure pure TCP latency without DNS jitter.
- **-t | --timeout <ms>:** Timeout per attempt in milliseconds (default: `5000ms`).
- **-c | --count <n>:** Number of attempts to send before exiting and displaying statistics.
- **-i | --interval <ms>:** Delay between attempts in milliseconds (default: `1000ms`).
- **-h | --help:** Displays command-line help and usage instructions.

### **Available Protocols**
- **basic:** Basic TCP connection / SYN-ACK test.
- **HTTP:** Minimal HTTP/HTTPS banner query and status code check (e.g. `HTTP/1.1 200 OK`).
- **SSH:** SSH version banner retrieval (e.g. `SSH-2.0-OpenSSH...`).
- **MCv2:** Modern Minecraft server status (1.7+) with version and player count.
- **MCv1:** Legacy Minecraft ping (packet `0xFE`).
- **FiveM:** FiveM / FXServer server info check.

---

## **🚀 Usage Examples**

Test a basic TCP connection to a local SSH port 4 times:
```sh
node app/main.js 127.0.0.1 22 SSH -c 4
```

Ping a web server with DNS resolution and 500ms intervals:
```sh
node app/main.js google.com 80 HTTP -r -c 5 -i 500
```

Continuously test a Minecraft server:
```sh
node app/main.js mc.hypixel.net 25565 MCv2 -r
```
Press **CTRL+C** at any time to stop the test and view complete statistics.

---

## **📂 Project Structure**
```
TCPing/
│── app/
│   ├── main.js               # Main CLI entry point.
│   ├── protocol/
│   │   ├── protocols.js      # Aggregates and discovers protocol modules.
│   │   └── protocols/
│   │       ├── basic.js      # Basic TCP connection protocol.
│   │       ├── fivem.js      # FiveM handshake & info.
│   │       ├── http.js       # HTTP/HTTPS banner query.
│   │       ├── mcv1.js       # MC legacy ping (0xFE).
│   │       ├── mcv2.js       # MC handshake & status (1.7+).
│   │       └── ssh.js        # SSH banner handshake.
│   └── utils/
│       ├── messages.js       # Help and statistics message utilities.
│       ├── minecraft.js      # Safe VarInt encoding and decoding.
│       └── validators.js     # IP, hostname, and port validation.
│── tests/                    # Automated unit and integration test suite.
│── package.json              # Project dependencies and CLI scripts.
│── README.md                 # Project documentation.
```

---

## **📝 License**
All the code is licensed under GPL v3.     
Feel free to modify and improve it! 😃

---

## **🙌 Contributing**
Got ideas, bug reports, or improvements?  
Feel free to open an issue or submit a pull request!

---

## **📬 Contact**
📧 **contact@gaetandev.fr**  
🌍 **[Website](https://gaetandev.fr)**  
💬 **Discord: GaetanDev**

---

## **🎉 Thank you for using TCPing!**
Happy testing and don't hesitate to contribute improvements!
