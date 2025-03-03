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

## **⚙️ Configuration**

The tool accepts command-line arguments in the following format:
```sh
node main.js <ip> <port> [protocol]
```

- **ip:** The target server's IP address.
- **port:** The target server's port (1–65535).
- **protocol (optional):** The protocol to simulate. If not provided, "basic" is used by default.

### **Available Protocols**
- **basic:** Basic TCP connection.
- **FiveM:** FiveM handshake & info.
- **MCv1:** MC legacy ping (0xFE).
- **MCv2:** MC handshake & status.

---

## **🚀 Usage**
To continuously test a TCP connection using the basic protocol:
```sh
node main.js 127.0.0.1 22 basic
```
Press **CTRL+C** to stop the test.

---

## **📂 Project Structure**
```
TCPing/
│── protocol/
│   ├── protocols.js          # Aggregates protocol modules.
│   └── protocols/
│       ├── basic.js          # Basic TCP connection protocol.
│       ├── fivem.js          # FiveM handshake & info.
│       ├── mcv1.js           # MC legacy ping (0xFE).
│       └── mcv2.js           # MC handshake & status.
│── utils/
│   ├── minecraft.js          # Utils minecraft functions.
│   ├── validators.js         # IP and port validation functions.
│   └── messages.js           # Help and error message utilities.
│── main.js                   # Main entry point.
│── package.json              # Project dependencies and scripts.
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
