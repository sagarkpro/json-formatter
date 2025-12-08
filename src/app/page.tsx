"use client";

import { ChangeEvent, useMemo, useState, useEffect } from "react";
import { useDebounce } from "use-debounce";

export default function Home() {
	const [raw, setRaw] = useState<string>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("savedJson") ?? "";
		}
		return "";
	});

	const [debouncedRaw] = useDebounce(raw, 300);

	function updateJsonInput(e: ChangeEvent<HTMLTextAreaElement>) {
		setRaw(e.target.value);
	}

	// save JSON safely
	useEffect(() => {
		if (typeof window !== "undefined" && debouncedRaw != null) {
			localStorage.setItem("savedJson", debouncedRaw);
		}
	}, [debouncedRaw]);

	const { formatted, error } = useMemo(() => {
		const text = debouncedRaw ?? "";

		if (!text.trim()) {
			return { formatted: "", error: "" };
		}

		try {
			const parsedJson = JSON.parse(text);
			const formattedJson = JSON.stringify(parsedJson, null, 2);
			return { formatted: formattedJson, error: "" };
		} catch (err) {
			const message = err instanceof Error ? err.message : "Invalid JSON input";
			return { formatted: "", error: message };
		}
	}, [debouncedRaw]);

	return (
		<div className="flex items-center justify-center p-4 overflow-clip font-semibold text-lg">
			<main className="flex w-full h-[calc(100svh-2rem)] gap-x-4 rounded-3xl border-2 overflow-clip p-4">
				<textarea value={raw} onChange={updateJsonInput} spellCheck={false} className="h-full w-1/2 bg-background-contrast rounded-3xl p-4 py-5 outline-none resize-none text-nowrap" />
				<textarea value={formatted || error} readOnly className="h-full w-1/2 bg-background-contrast rounded-3xl p-4 py-5 outline-none resize-none text-nowrap" />
			</main>
		</div>
	);
}
