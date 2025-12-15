"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChangeEvent, useMemo, useState, useEffect, useLayoutEffect } from "react";
import { FaCheck, FaCircleXmark, FaCopy, FaCross } from "react-icons/fa6";
import ReactJson from "react-json-view";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

export default function Home() {
	const githubDarkJsonTheme = {
		// Backgrounds
		base00: "#212121", // main background
		base01: "#2a2a2a", // expanded node bg
		base02: "#333333", // borders / highlights
		base03: "#7a7a7a", // comments / muted

		// Foreground
		base04: "#b5b5b5", // secondary text
		base05: "#ededed", // primary text
		base06: "#f0f0f0",
		base07: "#ffffff",

		// Syntax colors (VS Code GitHub Dark–like)
		base08: "#f85149", // red (errors / null)
		base09: "#79c0ff", // numbers
		base0A: "#d29922", // booleans
		base0B: "#7ee787", // strings
		base0C: "#a5d6ff", // keys / properties
		base0D: "#58a6ff", // object keys / arrows
		base0E: "#d2a8ff", // keywords
		base0F: "#ffa657", // functions / misc
	};

	const [file, setFile] = useState<File | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [formattedJson, setFormattedJson] = useState<object | null>(null);
	const [error, setError] = useState<object | null>(null);
	const [raw, setRaw] = useState<string | null>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("savedJson") ?? "";
		}
		return "";
	});

	async function handleSubmit(e: React.FormEvent) {
		try {
			e.preventDefault();
			if (!file) return;

			const formData = new FormData();
			formData.append("jsonFile", file);

			const res = await fetch("http://localhost:8080/api/json-formatter/format-file", {
				method: "POST",
				body: formData,
			});

			if (res?.ok) {
				const blob = await res.blob();
				const contentDisposition = res.headers.get("Content-Disposition");
				console.log("content dis:", contentDisposition, "headers: ", res.headers);
				
				const filename = contentDisposition ? contentDisposition.split("filename=")[1].replace(/"/g, "") : "processed-file.json";

				// Create download link and trigger download
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = filename;
				document.body.appendChild(link);
				link.click();

				// Cleanup
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
				setLoading(false);
			}
		} catch (err) {
			console.log("Error: ", err);
		} finally {
			setLoading(false);
		}
	}

	const handlePaste = async () => {
		try {
			const text = await navigator.clipboard.readText();
			setRaw(text);
			try{
				const formatted = JSON.parse(text);
				setFormattedJson(formatted);
			}
			catch(err){
				setError(err as object);
				console.log(err);
			}
		} catch (err) {
			console.error("Failed to read clipboard:", err);
			toast.error("Clipboard access denied. Please allow clipboard permissions.");
		}
	};

	function resetStates(){
		localStorage.removeItem("savedJson");
		setRaw(null); 
		setFormattedJson(null);
		setError(null);
	}

	// save JSON safely
	useEffect(() => {
		if (typeof window !== "undefined" && raw != null) {
			localStorage.setItem("savedJson", raw);
		}
	}, [raw]);

	useEffect(() => {
		setTimeout(() => {
			toast("Tip: Use File Upload for large json");
		}, 0);
	}, []);

	return (
		<div className="flex items-center justify-center p-4 overflow-clip font-semibold text-lg text-off-white">
			<main className="flex flex-wrap w-full overflow-clip p-4">
				<div className="w-full flex justify-center items-center gap-2 mb-4">
					{/* Hidden real input */}
					<input id="json-file" type="file" accept=".json" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

					<Tooltip>
						<TooltipTrigger asChild>
							{/* Fake input */}
							<label htmlFor="json-file" className="bg-off-white rounded-2xl py-1 px-4 text-black cursor-pointer min-w-max">
								{file ? file.name : "Upload File"}
							</label>
						</TooltipTrigger>
						<TooltipContent className="bg-off-white rounded-2xl font-semibold">
							<p>Upload an ugly JSON file and get a clean formatted version (max 50MB)</p>
						</TooltipContent>
					</Tooltip>

					{file && (
						<div className="w-max flex gap-x-2">
							{/* Submit button */}
							<Button className="bg-off-white rounded-full p-2 text-black hover:cursor-pointer" onClick={handleSubmit} disabled={!file}>
								<FaCheck />
							</Button>
							{/* Cancel button */}
							<Button className="bg-off-white rounded-full p-2 text-black hover:cursor-pointer" onClick={() => setFile(null)} disabled={!file}>
								<FaCircleXmark />
							</Button>
						</div>
					)}
				</div>

				<div className="relative w-full h-[calc(100svh-8rem)] rounded-2xl overflow-clip text-base bg-background-contrast p-3">
					<button onClick={resetStates} className="z-10 absolute top-3 right-3 bg-off-white rounded-full p-2 text-black">
						<FaCircleXmark />
					</button>
					<div className="w-full h-full overflow-scroll">
						{(formattedJson || error) ? (
							<ReactJson src={formattedJson ?? error} theme={githubDarkJsonTheme} enableClipboard={true} displayDataTypes={false} displayObjectSize={false} indentWidth={2} name={false} />
						) : (
							<button onClick={handlePaste} className="w-full h-full flex justify-center items-center">
								Click To Paste
							</button>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
