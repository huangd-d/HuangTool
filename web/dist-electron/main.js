import { BrowserWindow, app, ipcMain, net, protocol } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
//#region electron/main.js
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
protocol.registerSchemesAsPrivileged([{
	scheme: "app",
	privileges: {
		secure: true,
		standard: true,
		supportFetchAPI: true,
		stream: true,
		bypassCSP: true,
		allowServiceWorkers: true,
		corsEnabled: true
	}
}]);
var mainWindow;
function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
			webSecurity: true
		}
	});
	if (process.env.VITE_DEV_SERVER_URL) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
	else mainWindow.loadFile("dist/index.html");
}
async function getDocsDirectories() {
	const docsPath = path.join(__dirname, "docs");
	try {
		return (await fs.promises.readdir(docsPath, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((dir) => dir.name);
	} catch (error) {
		console.error("Error reading docs directory:", error);
		return [];
	}
}
app.whenReady().then(() => {
	createWindow();
	protocol.handle("app", async (request) => {
		const pathname = new URL(request.url).pathname;
		const RESOURCE_PATH = path.join(app.getAppPath(), "docs");
		let filePath;
		if (pathname === "/" || pathname === "/home") filePath = path.join(__dirname, "index.html");
		else {
			const dirName = pathname.replace(/^\/|\/$/g, "");
			filePath = path.join(RESOURCE_PATH, dirName, "index.html");
		}
		if (![path.join(app.getAppPath(), "docs"), __dirname].some((allowedPath) => filePath.startsWith(allowedPath))) return new Response("403 Forbidden", {
			status: 403,
			statusText: "Forbidden"
		});
		try {
			await fs.promises.access(filePath);
			return net.fetch(pathToFileURL(filePath).toString());
		} catch (error) {
			console.error("Error loading file:", error);
			return new Response("File not found", {
				status: 404,
				statusText: "Not Found"
			});
		}
	});
	ipcMain.handle("get-docs-directories", async () => {
		return await getDocsDirectories();
	});
	ipcMain.handle("open-doc-window", async (event, dir) => {
		const docWindow = new BrowserWindow({
			width: 1e3,
			height: 800,
			webPreferences: {
				preload: path.join(__dirname, "preload.js"),
				contextIsolation: true,
				nodeIntegration: false
			}
		});
		console.log("dir---", dir);
		docWindow.loadURL(`app://${dir}`);
		if (process.env.NODE_ENV === "development") docWindow.webContents.openDevTools();
		return true;
	});
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
//#endregion
