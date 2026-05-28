"use client";

import type { LoadedQuestion } from "@/lib/survey/data.server";
import { pickTranslation } from "@/lib/survey/shared";

type Answer = LoadedQuestion["answers"][number];

export function LikertQuestion({
  answers,
  selectedId,
  onSelect,
  locale,
}: {
  answers: Answer[];
  selectedId?: string;
  onSelect: (id: string) => void;
  locale: string;
}) {
  return (
    <div className="likert" role="radiogroup">
      {answers.map((a) => {
        const tr = pickTranslation(a.translations, locale);
        const selected = a.id === selectedId;
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`likert-option ${selected ? "likert-option--selected" : ""}`}
            onClick={() => onSelect(a.id)}
          >
            <span className="likert-option-num">{a.value}</span>
            <span className="likert-option-label">{tr?.label ?? ""}</span>
          </button>
        );
      })}
    </div>
  );
}

export function RadioQuestion({
  answers,
  selectedId,
  onSelect,
  locale,
}: {
  answers: Answer[];
  selectedId?: string;
  onSelect: (id: string) => void;
  locale: string;
}) {
  return (
    <div className="option-list" role="radiogroup">
      {answers.map((a) => {
        const tr = pickTranslation(a.translations, locale);
        const selected = a.id === selectedId;
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`option-row ${selected ? "option-row--selected" : ""}`}
            onClick={() => onSelect(a.id)}
          >
            <span className="option-marker" />
            <span>{tr?.label ?? ""}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CheckboxQuestion({
  answers,
  selectedIds,
  onToggle,
  locale,
}: {
  answers: Answer[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  locale: string;
}) {
  const set = new Set(selectedIds);
  return (
    <div className="option-list" role="group">
      {answers.map((a) => {
        const tr = pickTranslation(a.translations, locale);
        const selected = set.has(a.id);
        return (
          <button
            key={a.id}
            type="button"
            role="checkbox"
            aria-checked={selected}
            className={`option-row ${selected ? "option-row--selected" : ""}`}
            onClick={() => onToggle(a.id)}
          >
            <span className="option-marker option-marker--square" />
            <span>{tr?.label ?? ""}</span>
          </button>
        );
      })}
    </div>
  );
}

export function OpenQuestion({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className="open-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Type your answer…"}
    />
  );
}

export function RankingQuestion({
  answers,
  order,
  onChange,
  locale,
}: {
  answers: Answer[];
  order: string[];
  onChange: (order: string[]) => void;
  locale: string;
}) {
  const byId = new Map(answers.map((a) => [a.id, a]));
  const safeOrder = order.length === answers.length ? order : answers.map((a) => a.id);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...safeOrder];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };

  return (
    <div className="ranking-list">
      {safeOrder.map((id, i) => {
        const a = byId.get(id);
        if (!a) return null;
        const tr = pickTranslation(a.translations, locale);
        return (
          <div key={id} className="ranking-row">
            <span className="ranking-rank">{i + 1}</span>
            <span className="ranking-label">{tr?.label ?? ""}</span>
            <div className="ranking-controls">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button type="button" disabled={i === safeOrder.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}