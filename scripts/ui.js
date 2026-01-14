window.App = window.App || {}
;(function () {
	const STORAGE_KEY = "cartsync.state"
	const AI_HISTORY_KEY = "cartsync.ai.history"
	const defaultState = { items: [] }
	let aiReady = false
	let aiLoading = false
	let aiStreaming = false
	let conversation = []
	let activeAIMode = "chef"

	function loadState() {
		const params = new URLSearchParams(window.location.search)
		const encoded = params.get("state")
		if (encoded) {
			const decoded = window.App.Helpers.decodeState(encoded)
			if (decoded && Array.isArray(decoded.items)) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(decoded))
				params.delete("state")
				const newUrl =
					window.location.pathname +
					(params.toString() ? `?${params.toString()}` : "")
				window.history.replaceState({}, "", newUrl)
				return decoded
			}
		}
		try {
			const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
			if (saved && Array.isArray(saved.items)) {
				return saved
			}
		} catch (e) {
			console.warn("State load failed", e)
		}
		return { ...defaultState }
	}

	function saveState(state) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
		} catch (e) {
			console.warn("State save failed", e)
		}
	}

	function loadAIHistory() {
		try {
			const saved = JSON.parse(localStorage.getItem(AI_HISTORY_KEY))
			if (Array.isArray(saved)) {
				conversation = saved
			}
		} catch (e) {
			console.warn("AI history load failed", e)
		}
	}

	function saveAIHistory() {
		try {
			localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(conversation))
		} catch (e) {
			console.warn("AI history save failed", e)
		}
	}

	function guessCategory(name) {
		const lowered = name.toLowerCase()
		const map = {
			Produce: [
				"apple",
				"avocado",
				"banana",
				"tomato",
				"onion",
				"potato",
				"lettuce",
				"spinach",
				"berry",
				"berries",
				"lime",
				"lemon",
			],
			Dairy: ["milk", "cheese", "yogurt", "butter", "cream", "egg"],
			Bakery: ["bread", "bun", "bagel", "tortilla", "pita", "loaf"],
			Meat: ["chicken", "beef", "pork", "steak", "turkey", "bacon", "ham"],
			Frozen: ["frozen", "ice cream", "gelato", "popsicle"],
			Drinks: ["juice", "soda", "cola", "coffee", "tea", "water"],
			Pantry: [
				"rice",
				"pasta",
				"noodle",
				"flour",
				"sugar",
				"spice",
				"oil",
				"sauce",
				"salt",
				"pepper",
			],
			Snacks: ["chip", "chips", "cookie", "cracker", "candy", "bar"],
		}
		for (const [category, keywords] of Object.entries(map)) {
			if (keywords.some((k) => lowered.includes(k))) return category
		}
		return "General"
	}

	function showAIError(message) {
		const el = document.getElementById("ai-error")
		if (!el) return
		el.textContent = message
		el.classList.remove("hidden")
		setTimeout(() => el.classList.add("hidden"), 4000)
	}

	function renderAIHistory($aiMessages) {
		$aiMessages.empty()
		if (!conversation.length) {
			$aiMessages.append(
				'<div class="flex w-full justify-start">' +
					'<div class="max-w-[85%] p-3 rounded-2xl bg-gray-200 text-gray-800 rounded-tl-sm">' +
					'<p class="text-sm">Hi! I\'m your cooking assistant. Ask me "What do I need for tacos?" or "Suggest a healthy dinner."</p>' +
					"</div>" +
					"</div>"
			)
			return
		}
		conversation.forEach((msg) => {
			const isUser = msg.role === "user"
			const alignment = isUser ? "justify-end" : "justify-start"
			const bg = isUser
				? "bg-fuchsia-600 text-white rounded-tr-sm"
				: "bg-gray-200 text-gray-800 rounded-tl-sm"
			$aiMessages.append(
				`<div class="flex w-full ${alignment}">` +
					`<div class="max-w-[85%] p-3 rounded-2xl ${bg}">` +
					`<p class="text-sm whitespace-pre-line">${msg.content}</p>` +
					`</div>` +
					`</div>`
			)
		})
		$aiMessages.scrollTop($aiMessages.prop("scrollHeight"))
	}

	function initLanding() {
		// Basic landing behavior placeholder
		return true
	}

	function initApp() {
		const state = loadState()
		const $list = $("#list-container")
		const $progressText = $("#progress-text")
		const $signOutButton = $("#sign-out-button")
		const $progressBar = $("#progress-bar")
		const $input = $("#new-item-input")
		const $form = $("#add-form")
		const $clearCompleted = $("#btn-clear-completed")
		const $share = $("#btn-share")
		const $aiStatus = $("#ai-status")
		const $aiReadyBadge = $("#ai-ready-badge")
		const $aiProgressText = $("#ai-progress-text")
		const $aiProgressBar = $("#ai-progress-bar")
		const $aiChefBtn = $("#btn-ai-chef")
		const $aiSuggestBtn = $("#btn-ai-suggest")
		const $aiModal = $("#ai-modal")
		const $aiMessages = $("#ai-messages")
		const $aiInput = $("#ai-chat-input")
		const $aiForm = $("#ai-chat-form")
		const $aiSend = $("#ai-chat-send")
		const $aiStop = $("#ai-stop")
		const $aiModalClose = $("#ai-modal-close")

		loadAIHistory()

		function updateProgress() {
			const total = state.items.length
			const done = state.items.filter((i) => i.done).length
			$progressText.text(`${done}/${total} items`)
			const percent = total === 0 ? 0 : Math.round((done / total) * 100)
			$progressBar.css("width", `${percent}%`)
		}

		function renderEmptyState() {
			$list.html(
				'<div class="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-500">' +
					'<p class="font-bold text-lg mb-2">Your list is empty</p>' +
					'<p class="text-sm">Add an item or ask Chef Bot for ideas.</p>' +
					"</div>"
			)
		}

		function renderList() {
			if (!state.items.length) {
				renderEmptyState()
				updateProgress()
				return
			}
			$list.empty()
			state.items.forEach((item) => {
				const checked = item.done ? "checked" : ""
				const strike = item.done
					? "line-through text-gray-400"
					: "text-gray-800"
				const badge = item.category
					? `<span class="text-xs text-gray-400">${item.category}</span>`
					: ""
				$list.append(
					`<div class="item-row bg-white p-4 rounded-xl shadow-sm flex items-center gap-3 border-l-4 ${
						item.done ? "border-fuchsia-500" : "border-gray-200"
					}" data-id="${item.id}">` +
						`<input type="checkbox" class="item-toggle item-checkbox w-5 h-5 text-fuchsia-600 border-gray-300 rounded" ${checked}>` +
						`<div class="flex-1"><span class="${strike} font-medium">${item.text}</span></div>` +
						`${badge}` +
						`</div>`
				)
			})
			updateProgress()
		}

		function addItemsFromText(text) {
			const parts = window.App.Helpers.parseListText(text)
			if (!parts.length) return
			parts.forEach((p) => {
				state.items.push({
					id: window.App.Helpers.generateId(),
					text: p,
					done: false,
					category: guessCategory(p),
				})
			})
			saveState(state)
			renderList()
		}

		function clearCompletedItems() {
			state.items = state.items.filter((i) => !i.done)
			saveState(state)
			renderList()
		}

		function shareList() {
			const encoded = window.App.Helpers.encodeState(state)
			const url = `${window.location.origin}${window.location.pathname}?state=${encoded}`
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard
					.writeText(url)
					.then(() => {
						alert("Share link copied to clipboard!")
					})
					.catch(() => {
						window.prompt("Copy this link to share:", url)
					})
			} else {
				window.prompt("Copy this link to share:", url)
			}
		}

		function sortSmart() {
			state.items = state.items.map((item) => ({
				...item,
				category: guessCategory(item.text),
			}))
			state.items.sort((a, b) => {
				if (a.category === b.category) return a.text.localeCompare(b.text)
				return a.category.localeCompare(b.category)
			})
			saveState(state)
			renderList()
		}

		function toggleAIControls(enabled) {
			const method = enabled ? "removeClass" : "addClass"
			const disableProp = !enabled
			$(".ai-trigger")[method]("opacity-50 cursor-not-allowed")
			$(".ai-trigger").prop("disabled", disableProp)
			$aiInput.prop("disabled", disableProp)
			$aiSend.prop("disabled", disableProp)
			$aiStop.prop("disabled", true)
		}

		async function loadLLM() {
			if (aiLoading || aiReady) return
			aiLoading = true
			$aiStatus.removeClass("hidden")
			try {
				await window.AppLLM.load(null, (percent) => {
					$aiProgressText.text(`Loading AI... ${percent}%`)
					$aiProgressBar.css("width", `${percent}%`)
				})
				aiReady = true
				$aiStatus.addClass("hidden")
				$aiReadyBadge.removeClass("hidden")
				toggleAIControls(true)
			} catch (e) {
				showAIError(e.message || "AI failed to load")
				toggleAIControls(false)
			}
		}

		function openAIModal(mode) {
			activeAIMode = mode
			renderAIHistory($aiMessages)
			$aiModal.removeClass("hidden").addClass("flex")
			setTimeout(() => {
				$aiInput.trigger("focus")
			}, 150)
		}

		function closeAIModal() {
			$aiModal.addClass("hidden").removeClass("flex")
		}

		function appendAssistantMessage(content) {
			conversation.push({ role: "assistant", content })
			saveAIHistory()
			renderAIHistory($aiMessages)
		}

		function appendUserMessage(content) {
			conversation.push({ role: "user", content })
			saveAIHistory()
			renderAIHistory($aiMessages)
		}

		async function runAIChat(prompt) {
			if (!aiReady) {
				showAIError("AI is not ready yet.")
				return
			}
			aiStreaming = true
			$aiSend.prop("disabled", true)
			$aiStop.prop("disabled", false)
			const assistantMsg = { role: "assistant", content: "" }
			conversation.push({ role: "user", content: prompt })
			conversation.push(assistantMsg)
			saveAIHistory()
			renderAIHistory($aiMessages)
			try {
				await window.AppLLM.generate(prompt, {
					system:
						"You are a helpful cooking assistant who answers briefly and lists ingredients clearly.",
					onToken: (t) => {
						assistantMsg.content += t
						renderAIHistory($aiMessages)
					},
				})
			} catch (e) {
				assistantMsg.content += "\n[Error] " + (e.message || "AI stopped")
				renderAIHistory($aiMessages)
			} finally {
				aiStreaming = false
				saveAIHistory()
				$aiSend.prop("disabled", false)
				$aiStop.prop("disabled", true)
			}
		}

		// Initial render
		renderList()
		updateProgress()
		toggleAIControls(false)
		loadLLM()

		// Events
		$form.on("submit", function (e) {
			e.preventDefault()
			const text = $input.val().trim()
			if (!text) return
			addItemsFromText(text)
			$input.val("")
		})

		$list.on("change", ".item-toggle", function () {
			const id = $(this).closest("[data-id]").data("id")
			const found = state.items.find((i) => i.id === id)
			if (found) {
				found.done = this.checked
				saveState(state)
				renderList()
			}
		})

		$list.on("click", ".item-row", function (e) {
			if ($(e.target).is(".item-checkbox")) return
			const id = $(this).data("id")
			const found = state.items.find((i) => i.id === id)
			if (found) {
				found.done = !found.done
				saveState(state)
				renderList()
			}
		})

		$clearCompleted.on("click", function () {
			clearCompletedItems()
		})

		// $signOutButton.on("click", function () {
		// 	console.log("Sign out clicked")
		// })

		$share.on("click", function () {
			shareList()
		})

		$aiSuggestBtn.on("click", function () {
			if (!aiReady) return
			sortSmart()
		})

		$aiChefBtn.on("click", function () {
			if (!aiReady) return
			openAIModal("chef")
		})

		$aiModalClose.on("click", function () {
			closeAIModal()
		})

		$aiModal.on("click", function (e) {
			if (e.target === this) closeAIModal()
		})

		$aiForm.on("submit", function (e) {
			e.preventDefault()
			if (!aiReady || aiStreaming) return
			const prompt = $aiInput.val().trim()
			if (!prompt) return
			$aiInput.val("")
			appendUserMessage(prompt)
			renderAIHistory($aiMessages)
			runAIChat(prompt)
		})

		$aiStop.on("click", function () {
			if (!aiStreaming) return
			window.AppLLM.stop()
			aiStreaming = false
			$aiSend.prop("disabled", false)
			$aiStop.prop("disabled", true)
		})

		window.addEventListener("storage", (e) => {
			if (e.key === STORAGE_KEY && e.newValue) {
				try {
					const incoming = JSON.parse(e.newValue)
					if (incoming && Array.isArray(incoming.items)) {
						state.items = incoming.items
						renderList()
					}
				} catch (err) {
					console.warn("Sync failed", err)
				}
			}
		})
	}

	App.init = function () {
		const isApp = !!document.getElementById("list-container")
		if (isApp) {
			initApp()
		} else {
			initLanding()
		}
	}
})()
