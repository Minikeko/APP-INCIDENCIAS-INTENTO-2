"use client";

import { useState, useRef, useEffect } from "react";

const CATEGORIAS = [
  {
    nombre: "Recientes",
    icono: "🕐",
    emojis: [] as string[], // se rellena dinámicamente
  },
  {
    nombre: "Caras",
    icono: "😀",
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩",
      "😘","😗","☺️","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔",
      "🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷",
      "🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐",
      "😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭",
      "😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️",
    ],
  },
  {
    nombre: "Gestos",
    icono: "👋",
    emojis: [
      "👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆",
      "🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️",
      "💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀",
      "👁️","👅","👄","💋","🫦","👶","🧒","👦","👧","🧑","👱","👨","🧔","👩","🧓","👴","👵",
    ],
  },
  {
    nombre: "Animales",
    icono: "🐶",
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵",
      "🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝",
      "🐛","🦋","🐌","🐞","🐜","🦟","🦗","🪲","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑",
      "🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧",
    ],
  },
  {
    nombre: "Comida",
    icono: "🍕",
    emojis: [
      "🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝",
      "🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🧄","🧅","🥔","🍠","🫚","🌽","🍄","🥕",
      "🫛","🧆","🥙","🫔","🌮","🌯","🥪","🥗","🍿","🧈","🍱","🍘","🍙","🍚","🍛","🍜",
      "🍝","🍞","🥐","🥖","🫓","🥨","🥯","🧇","🥞","🧈","🍳","🥚","🧀","🥓","🥩","🍗",
      "🍖","🦴","🌭","🍔","🍟","🍕","🫕","🥪","🌮","🌯","🫔","🥙","🧆","🥚","🍳","🥘",
      "🍲","🫕","🥣","🥗","🍿","🧂","🥫","🍱","🍣","🍤","🍙","🍚","🍘","🍥","🥮","🍡",
      "🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜",
      "🍯","🧃","🥤","🧋","☕","🍵","🫖","🧉","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧊",
    ],
  },
  {
    nombre: "Viajes",
    icono: "✈️",
    emojis: [
      "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵",
      "🚲","🛴","🛹","🛼","🚏","🛣️","🛤️","⛽","🚧","⚓","🛟","⛵","🚤","🛥️","🛳️","⛴️",
      "🚢","✈️","🛩️","🛫","🛬","🪂","💺","🚁","🚟","🚠","🚡","🛰️","🚀","🛸","🎡","🎢",
      "🎠","🏗️","🌁","🗼","🗽","⛪","🕌","🛕","⛩️","🕍","🗿","🏛️","🏟️","🏪","🏫","🏬",
    ],
  },
  {
    nombre: "Actividades",
    icono: "⚽",
    emojis: [
      "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🥊","🥋",
      "🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂","🪂","🏋️","🤼","🤸","⛹️","🤺","🏇",
      "🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖️","🏵️","🎗️",
      "🎫","🎟️","🎪","🤹","🎭","🎨","🎬","🎤","🎧","🎼","🎵","🎶","🎹","🥁","🪘","🎷",
    ],
  },
  {
    nombre: "Objetos",
    icono: "💡",
    emojis: [
      "💌","💣","💬","💭","💫","💥","💦","💨","💤","💢","💯","✅","❎","🔴","🟠","🟡",
      "🟢","🔵","🟣","⚫","⚪","🟤","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔",
      "❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯",
      "🪬","🧿","🔮","💎","🔑","🗝️","🔐","🔒","🔓","🔨","🪓","⛏️","⚒️","🛠️","🗡️","⚔️",
      "🛡️","🔧","🪛","🔩","⚙️","🗜️","⚖️","🦯","🔗","⛓️","🪝","🧲","🪜","💊","💉","🩸",
      "🩹","🩺","🩻","🚪","🪞","🪟","🛏️","🛋️","🚽","🪠","🚿","🛁","🪤","🪒","🧴","🧷",
      "🧹","🧺","🧻","🪣","🧼","🫧","🪥","🧽","🧯","🛒","🚪","💡","🔦","🕯️","🪔","🧱",
    ],
  },
  {
    nombre: "Símbolos",
    icono: "❤️",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓",
      "💗","💖","💘","💝","🔰","♻️","✅","❎","🔱","📛","🔰","⭕","✅","❌","❎","〽️",
      "✳️","✴️","❇️","🔅","🔆","⚜️","🔰","🛑","⛔","🚫","🚳","🚭","🚯","🚱","🚷","📵",
      "🔞","☢️","☣️","⬆️","↗️","➡️","↘️","⬇️","↙️","⬅️","↖️","↕️","↔️","↩️","↪️","🔄",
      "🔃","🎵","🎶","➕","➖","➗","✖️","♾️","💲","💱","™️","©️","®️","〰️","➰","➿",
      "🔚","🔙","🔛","🔜","🔝","🆒","🆓","🆕","🆖","🆗","🆙","🆘","⁉️","🔟","🔠","🔡",
    ],
  },
];

const MAX_RECIENTES = 32;
const KEY_RECIENTES = "emoji-recientes";

function getRecientes(): string[] {
  try {
    const raw = localStorage.getItem(KEY_RECIENTES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function guardarReciente(emoji: string) {
  try {
    const prev = getRecientes().filter((e) => e !== emoji);
    const nuevos = [emoji, ...prev].slice(0, MAX_RECIENTES);
    localStorage.setItem(KEY_RECIENTES, JSON.stringify(nuevos));
  } catch {
    // sin localStorage (SSR), ignoramos
  }
}

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPickerPropio({ onSelect, onClose }: EmojiPickerProps) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState(1); // empieza en "Caras"
  const [recientes, setRecientes] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      const recientesGuardados = getRecientes();
      if (activo) setRecientes(recientesGuardados);
    })();
    return () => { activo = false; };
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function handleSelect(emoji: string) {
    guardarReciente(emoji);
    setRecientes(getRecientes());
    onSelect(emoji);
  }

  const categorias = CATEGORIAS.map((c, i) =>
    i === 0 ? { ...c, emojis: recientes } : c
  );

  const emojisFiltrados = busqueda
    ? categorias.flatMap((c) => c.emojis).filter((e) => {
        // búsqueda básica por nombre unicode si el emoji contiene el texto
        // (aproximación: filtramos por coincidencia directa de carácter o búsqueda vacía)
        return e.includes(busqueda);
      })
    : null;

  const categoriasAMostrar = busqueda
    ? [{ nombre: "Resultados", icono: "🔍", emojis: emojisFiltrados || [] }]
    : categorias.filter((c) => c.emojis.length > 0 || CATEGORIAS.indexOf(c) > 0);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 z-50 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-2xl w-80 flex flex-col overflow-hidden"
      style={{ maxHeight: "360px" }}
    >
      {/* Búsqueda */}
      <div className="px-3 pt-3 pb-2">
        <input
          autoFocus
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar emoji..."
          className="w-full bg-[var(--bg-panel-raised)] border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Tabs de categorías */}
      {!busqueda && (
        <div className="flex border-b border-[var(--border-subtle)] px-1 overflow-x-auto scrollbar-none">
          {categorias.map((cat, i) => {
            if (i === 0 && recientes.length === 0) return null;
            return (
              <button
                key={i}
                onClick={() => setCategoriaActiva(i)}
                className={`shrink-0 px-2 py-1.5 text-base transition-colors ${
                  categoriaActiva === i
                    ? "border-b-2 border-[var(--accent)]"
                    : "opacity-50 hover:opacity-80"
                }`}
                title={cat.nombre}
              >
                {cat.icono}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid de emojis */}
      <div className="flex-1 overflow-y-auto p-2">
        {(busqueda ? categoriasAMostrar : [categorias[categoriaActiva]]).map((cat) => (
          <div key={cat.nombre}>
            {busqueda && (
              <p className="text-xs text-[var(--text-muted)] px-1 mb-1">{cat.nombre}</p>
            )}
            {cat.emojis.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] px-1 py-2 text-center">
                {busqueda ? "Sin resultados" : "Sin emojis recientes"}
              </p>
            ) : (
              <div className="grid grid-cols-8 gap-0.5">
                {cat.emojis.map((emoji, j) => (
                  <button
                    key={j}
                    onClick={() => handleSelect(emoji)}
                    className="text-xl p-1 rounded hover:bg-[var(--bg-panel-raised)] transition-colors leading-none"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
