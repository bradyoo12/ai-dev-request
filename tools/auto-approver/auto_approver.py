"""
Claude Auto-Approver
A desktop app that automatically clicks 'Allow' / 'Yes' buttons
on Claude Code permission and question prompts.

Usage:
  1. Run: python auto_approver.py
  2. Click 'Capture Button' and click on the button you want auto-clicked
  3. Click 'Start' to begin auto-scanning and clicking

Requirements: pip install -r requirements.txt
"""

import json
import os
import sys
import threading
import time
import tkinter as tk
from tkinter import ttk, messagebox
from pathlib import Path

try:
    import pyautogui
    import pynput.mouse as pmouse
    from PIL import Image, ImageTk
except ImportError:
    print("Missing dependencies. Run: pip install -r requirements.txt")
    sys.exit(1)

# Disable pyautogui fail-safe pause (we handle our own safety)
pyautogui.PAUSE = 0.1

APP_DIR = Path(__file__).parent
TEMPLATES_DIR = APP_DIR / "templates"
CONFIG_FILE = APP_DIR / "config.json"


class AutoApprover:
    """Desktop app that auto-clicks Claude Code approval buttons."""

    def __init__(self):
        self.scanning = False
        self.scan_thread = None
        self.templates: list[str] = []
        self.click_count = 0

        TEMPLATES_DIR.mkdir(exist_ok=True)

        self._build_gui()
        self._load_config()
        self._refresh_template_list()

    # ── GUI ──────────────────────────────────────────────────────

    def _build_gui(self):
        self.root = tk.Tk()
        self.root.title("Claude Auto-Approver")
        self.root.attributes("-topmost", True)
        self.root.resizable(False, False)
        self.root.configure(bg="#1a1a2e")
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

        style = ttk.Style()
        style.theme_use("clam")

        # Dark theme colors
        bg = "#1a1a2e"
        fg = "#e0e0e0"
        accent = "#e94560"
        accent2 = "#0f3460"
        card_bg = "#16213e"

        style.configure("TFrame", background=bg)
        style.configure("TLabel", background=bg, foreground=fg, font=("Segoe UI", 10))
        style.configure("Header.TLabel", background=bg, foreground=fg, font=("Segoe UI", 14, "bold"))
        style.configure("Status.TLabel", font=("Segoe UI", 11, "bold"))
        style.configure("TLabelframe", background=bg, foreground=fg)
        style.configure("TLabelframe.Label", background=bg, foreground=fg, font=("Segoe UI", 10))

        style.configure(
            "Start.TButton",
            background="#28a745",
            foreground="white",
            font=("Segoe UI", 11, "bold"),
            padding=(15, 8),
        )
        style.map("Start.TButton", background=[("active", "#218838")])

        style.configure(
            "Stop.TButton",
            background=accent,
            foreground="white",
            font=("Segoe UI", 11, "bold"),
            padding=(15, 8),
        )
        style.map("Stop.TButton", background=[("active", "#c0392b")])

        style.configure(
            "Capture.TButton",
            background=accent2,
            foreground="white",
            font=("Segoe UI", 10),
            padding=(10, 6),
        )
        style.map("Capture.TButton", background=[("active", "#1a4a8a")])

        style.configure(
            "Delete.TButton",
            background="#6c757d",
            foreground="white",
            font=("Segoe UI", 9),
            padding=(6, 4),
        )

        # Main container
        main = ttk.Frame(self.root, padding=15)
        main.pack(fill="both", expand=True)

        # Title
        ttk.Label(main, text="Claude Auto-Approver", style="Header.TLabel").pack(
            pady=(0, 10)
        )

        # ── Status bar ───────────────────────────────────────────
        status_frame = ttk.Frame(main)
        status_frame.pack(fill="x", pady=(0, 10))

        ttk.Label(status_frame, text="Status:").pack(side="left")
        self.status_var = tk.StringVar(value="  STOPPED")
        self.status_label = ttk.Label(
            status_frame,
            textvariable=self.status_var,
            style="Status.TLabel",
            foreground="#e94560",
        )
        self.status_label.pack(side="left", padx=5)

        self.count_var = tk.StringVar(value="Clicks: 0")
        ttk.Label(status_frame, textvariable=self.count_var).pack(side="right")

        # ── Control buttons ──────────────────────────────────────
        btn_frame = ttk.Frame(main)
        btn_frame.pack(fill="x", pady=5)

        self.toggle_btn = ttk.Button(
            btn_frame, text="  START", style="Start.TButton", command=self.toggle
        )
        self.toggle_btn.pack(side="left", padx=(0, 5))

        self.capture_btn = ttk.Button(
            btn_frame,
            text="  Capture Button",
            style="Capture.TButton",
            command=self.start_capture,
        )
        self.capture_btn.pack(side="left", padx=5)

        self.delete_btn = ttk.Button(
            btn_frame,
            text="Delete Selected",
            style="Delete.TButton",
            command=self.delete_template,
        )
        self.delete_btn.pack(side="right")

        # ── Templates list ───────────────────────────────────────
        templates_frame = ttk.LabelFrame(main, text=" Captured Buttons ", padding=5)
        templates_frame.pack(fill="x", pady=(10, 5))

        self.templates_listbox = tk.Listbox(
            templates_frame,
            height=3,
            bg=card_bg,
            fg=fg,
            selectbackground=accent2,
            font=("Consolas", 9),
            relief="flat",
            borderwidth=0,
        )
        self.templates_listbox.pack(fill="x")

        # ── Preview label ────────────────────────────────────────
        self.preview_label = ttk.Label(main, text="")
        self.templates_listbox.bind("<<ListboxSelect>>", self._show_preview)

        # ── Settings ─────────────────────────────────────────────
        settings_frame = ttk.LabelFrame(main, text=" Settings ", padding=8)
        settings_frame.pack(fill="x", pady=5)

        ttk.Label(settings_frame, text="Scan interval (sec):").grid(
            row=0, column=0, sticky="w", pady=2
        )
        self.interval_var = tk.DoubleVar(value=1.0)
        ttk.Spinbox(
            settings_frame,
            from_=0.3,
            to=5.0,
            increment=0.1,
            textvariable=self.interval_var,
            width=6,
            font=("Consolas", 10),
        ).grid(row=0, column=1, padx=8, pady=2)

        ttk.Label(settings_frame, text="Match confidence:").grid(
            row=1, column=0, sticky="w", pady=2
        )
        self.confidence_var = tk.DoubleVar(value=0.8)
        ttk.Spinbox(
            settings_frame,
            from_=0.5,
            to=1.0,
            increment=0.05,
            textvariable=self.confidence_var,
            width=6,
            font=("Consolas", 10),
        ).grid(row=1, column=1, padx=8, pady=2)

        # ── Log ──────────────────────────────────────────────────
        log_frame = ttk.LabelFrame(main, text=" Activity Log ", padding=5)
        log_frame.pack(fill="both", expand=True, pady=(5, 0))

        self.log_text = tk.Text(
            log_frame,
            height=8,
            width=45,
            bg=card_bg,
            fg="#a0d0a0",
            insertbackground=fg,
            font=("Consolas", 9),
            relief="flat",
            borderwidth=0,
            state="disabled",
        )
        self.log_text.pack(fill="both", expand=True)

        # ── Hotkey hint ──────────────────────────────────────────
        ttk.Label(
            main,
            text="Tip: Ctrl+Shift+A = toggle  |  Ctrl+Shift+C = capture",
            foreground="#666",
            font=("Segoe UI", 8),
        ).pack(pady=(5, 0))

        # Register global hotkeys
        self._setup_hotkeys()

    # ── Hotkeys ──────────────────────────────────────────────────

    def _setup_hotkeys(self):
        """Register global keyboard hotkeys."""
        from pynput import keyboard

        def on_activate_toggle():
            self.root.after(0, self.toggle)

        def on_activate_capture():
            self.root.after(0, self.start_capture)

        hotkeys = keyboard.GlobalHotKeys(
            {
                "<ctrl>+<shift>+a": on_activate_toggle,
                "<ctrl>+<shift>+c": on_activate_capture,
            }
        )
        hotkeys.daemon = True
        hotkeys.start()

    # ── Scanning ─────────────────────────────────────────────────

    def toggle(self):
        if self.scanning:
            self.stop_scanning()
        else:
            self.start_scanning()

    def start_scanning(self):
        if not self.templates:
            self.log("No button templates captured yet!")
            messagebox.showwarning(
                "No Templates",
                "Capture at least one button first.\n\n"
                "Click 'Capture Button', then click on the\n"
                "'Allow' or 'Yes' button in VS Code.",
            )
            return

        self.scanning = True
        self.status_var.set("  RUNNING")
        self.status_label.configure(foreground="#28a745")
        self.toggle_btn.configure(text="  STOP", style="Stop.TButton")
        self.capture_btn.configure(state="disabled")

        self.scan_thread = threading.Thread(target=self._scan_loop, daemon=True)
        self.scan_thread.start()
        self.log(f"Scanning started ({len(self.templates)} template(s))")

    def stop_scanning(self):
        self.scanning = False
        self.status_var.set("  STOPPED")
        self.status_label.configure(foreground="#e94560")
        self.toggle_btn.configure(text="  START", style="Start.TButton")
        self.capture_btn.configure(state="normal")
        self.log("Scanning stopped.")

    def _scan_loop(self):
        """Background thread: scan screen for button templates and click."""
        while self.scanning:
            for template_path in list(self.templates):
                if not self.scanning:
                    break
                try:
                    location = pyautogui.locateOnScreen(
                        template_path,
                        confidence=self.confidence_var.get(),
                        grayscale=False,
                    )
                    if location:
                        center = pyautogui.center(location)
                        pyautogui.click(center.x, center.y)
                        self.click_count += 1
                        self.root.after(0, self._update_ui_after_click, center)
                        time.sleep(1.0)  # Pause after clicking to avoid double-clicks
                except pyautogui.ImageNotFoundException:
                    pass  # Template not found on screen - normal
                except Exception as e:
                    self.root.after(0, self.log, f"Scan error: {e}")

            try:
                time.sleep(self.interval_var.get())
            except tk.TclError:
                break  # App is closing

    def _update_ui_after_click(self, center):
        self.count_var.set(f"Clicks: {self.click_count}")
        self.log(f"Clicked button at ({center.x}, {center.y})")

    # ── Capture ──────────────────────────────────────────────────

    def start_capture(self):
        """Enter capture mode: user clicks on the button to capture."""
        self.log("Click on the button you want to auto-click...")
        self.root.iconify()  # Minimize to get out of the way

        def wait_and_capture():
            time.sleep(0.8)  # Let the window minimize

            def on_click(x, y, button, pressed):
                if not pressed:
                    return  # Only act on press
                # Capture a region around the click point
                region_w, region_h = 140, 44
                left = max(0, x - region_w // 2)
                top = max(0, y - region_h // 2)

                try:
                    screenshot = pyautogui.screenshot(
                        region=(left, top, region_w, region_h)
                    )

                    idx = len(list(TEMPLATES_DIR.glob("button_*.png")))
                    path = str(TEMPLATES_DIR / f"button_{idx}.png")
                    screenshot.save(path)

                    self.templates.append(path)
                    self._save_config()

                    self.root.after(0, self._on_capture_done, path, x, y)
                except Exception as e:
                    self.root.after(0, self.log, f"Capture error: {e}")
                    self.root.after(0, self.root.deiconify)

                return False  # Stop listener

            with pmouse.Listener(on_click=on_click) as listener:
                listener.join()

        threading.Thread(target=wait_and_capture, daemon=True).start()

    def _on_capture_done(self, path, x, y):
        name = Path(path).stem
        self.templates_listbox.insert("end", f"  {name}  ({x}, {y})")
        self.log(f"Captured '{name}' at ({x}, {y})")
        self.root.deiconify()  # Restore window

    # ── Template management ──────────────────────────────────────

    def delete_template(self):
        sel = self.templates_listbox.curselection()
        if not sel:
            return
        idx = sel[0]
        if idx < len(self.templates):
            path = self.templates.pop(idx)
            try:
                os.remove(path)
            except OSError:
                pass
            self.templates_listbox.delete(idx)
            self._save_config()
            self.log(f"Deleted template {idx}")

    def _show_preview(self, event):
        sel = self.templates_listbox.curselection()
        if not sel or sel[0] >= len(self.templates):
            return
        path = self.templates[sel[0]]
        try:
            img = Image.open(path)
            # Scale up 2x for visibility
            img = img.resize((img.width * 2, img.height * 2), Image.NEAREST)
            photo = ImageTk.PhotoImage(img)
            self.preview_label.configure(image=photo)
            self.preview_label.image = photo
            self.preview_label.pack(pady=5)
        except Exception:
            self.preview_label.pack_forget()

    def _refresh_template_list(self):
        self.templates_listbox.delete(0, "end")
        for path in self.templates:
            name = Path(path).stem
            self.templates_listbox.insert("end", f"  {name}")

    # ── Config persistence ───────────────────────────────────────

    def _load_config(self):
        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE) as f:
                    config = json.load(f)
                self.confidence_var.set(config.get("confidence", 0.8))
                self.interval_var.set(config.get("interval", 1.0))
                for path in config.get("templates", []):
                    if os.path.exists(path):
                        self.templates.append(path)
            except (json.JSONDecodeError, Exception):
                pass

    def _save_config(self):
        config = {
            "confidence": self.confidence_var.get(),
            "interval": self.interval_var.get(),
            "templates": self.templates,
        }
        with open(CONFIG_FILE, "w") as f:
            json.dump(config, f, indent=2)

    # ── Logging ──────────────────────────────────────────────────

    def log(self, message: str):
        ts = time.strftime("%H:%M:%S")
        self.log_text.configure(state="normal")
        self.log_text.insert("end", f"[{ts}] {message}\n")
        self.log_text.see("end")
        self.log_text.configure(state="disabled")

    # ── Lifecycle ────────────────────────────────────────────────

    def _on_close(self):
        self.scanning = False
        self._save_config()
        self.root.destroy()

    def run(self):
        self.log("Ready! Capture a button to get started.")
        self.log("Global hotkeys: Ctrl+Shift+A (toggle), Ctrl+Shift+C (capture)")
        self.root.mainloop()


if __name__ == "__main__":
    app = AutoApprover()
    app.run()
