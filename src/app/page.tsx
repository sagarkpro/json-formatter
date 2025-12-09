"use client";

import { ChangeEvent, useMemo, useState, useEffect } from "react";
import { FaCopy } from "react-icons/fa6";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

export default function Home() {
	const [raw, setRaw] = useState<string>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("savedJson") ?? "";
		}
		return "";
	});

	const [formatted, setFormatted] = useState<string>("");

	const [debouncedRaw] = useDebounce(raw, 300);

	function updateJsonInput(e: ChangeEvent<HTMLTextAreaElement>) {
		setRaw(e.target.value);
	}

	function updateFormattedJsonInput(e: ChangeEvent<HTMLTextAreaElement>) {
		setFormatted(e.target.value);
	}

	function copyFormattedJson(){
		if (typeof window !== "undefined" && formatted) {
			window.navigator.clipboard.writeText(formatted || error);
			toast("Copied to Clipboard")
		}
		return;
	}

	// save JSON safely
	useEffect(() => {
		if (typeof window !== "undefined" && debouncedRaw != null) {
			localStorage.setItem("savedJson", debouncedRaw);
		}
	}, [debouncedRaw]);

	const { error } = useMemo(() => {
		const text = debouncedRaw ?? "";

		if (!text.trim()) {
			return { error: "" };
		}

		try {
			const parsedJson = JSON.parse(text);
			const formattedJson = JSON.stringify(parsedJson, null, 4);
			setFormatted(formattedJson);
			return { error: "" };
		} catch (err) {
			const message = err instanceof Error ? err.message : "Invalid JSON input";
			setFormatted("");
			return { error: message };
		}
	}, [debouncedRaw]);

	return (
		<div className="flex items-center justify-center p-4 overflow-clip font-semibold text-lg text-off-white">
			<main className="flex w-full h-[calc(100svh-2rem)] gap-x-4 overflow-clip p-4">
				<div className="w-1/2 h-full">
					<textarea value={raw} onChange={updateJsonInput} spellCheck={false} className="h-full w-full bg-background-contrast rounded-3xl p-4 py-5 outline-none resize-none text-nowrap" />
				</div>
				<div className="w-1/2 h-full relative">
					<textarea value={error || formatted} onChange={updateFormattedJsonInput} spellCheck={false} className="h-full w-full bg-background-contrast rounded-3xl p-4 py-5 outline-none resize-none text-nowrap" />
					<button onClick={copyFormattedJson} className="text-white absolute top-4 right-4 hover:cursor-pointer">
						<FaCopy />
					</button>
				</div>
			</main>
		</div>
	);
}
