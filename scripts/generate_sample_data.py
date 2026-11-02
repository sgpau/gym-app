#!/usr/bin/env python3
"""Genera web/public/sample-data.json (datos de prueba de la PWA): un año de entrenos ficticios pero realistas.

- Usa las rutinas y ejercicios por defecto: lunes Tren superior 1, martes Tren inferior 1,
  jueves Tren superior 2 y viernes Tren inferior 2.
- Progresión gradual de cargas (más rápida al principio), con ruido, semanas de descarga
  cada 8 semanas, entrenos sueltos que se saltan, una gripe en enero y vacaciones en agosto.
- La última serie a veces sale con una repetición menos, como en la vida real.

Uso: python3 scripts/generate_sample_data.py [--end AAAA-MM-DD] [--seed N]
La app desplaza las fechas al importar los datos de prueba, así que siempre parecen "del último año".
"""

import argparse
import json
import math
import random
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path

# GymApp/Resources/sample-data.json (app Swift) se queda con las rutinas antiguas y ya no se regenera.
OUTPUT = Path(__file__).resolve().parent.parent / "web" / "public" / "sample-data.json"

# nombre, grupo muscular, tipo (los mismos que los ejercicios por defecto de la PWA, web/src/db/seed.ts)
EXERCISES = [
    ("Press de banca", "chest", "reps"),
    ("Remo neutro", "back", "reps"),
    ("Press militar", "shoulders", "reps"),
    ("Curl de bíceps", "biceps", "reps"),
    ("Extensión de tríceps", "triceps", "reps"),
    ("Hip thrust", "glutes", "reps"),
    ("Sentadilla en multipower", "legs", "reps"),
    ("Zancadas en multipower", "legs", "reps"),
    ("Extensión de cuádriceps", "legs", "reps"),
    ("Elevación de talones", "legs", "reps"),
    ("Jalón al pecho", "back", "reps"),
    ("Press inclinado", "chest", "reps"),
    ("Remo abierto", "back", "reps"),
    ("Face pull", "shoulders", "reps"),
    ("Elevaciones laterales", "shoulders", "reps"),
    ("Peso muerto rumano", "glutes", "reps"),
    ("Sentadilla búlgara", "legs", "reps"),
    ("Abducción", "glutes", "reps"),
    ("Aducción", "legs", "reps"),
    ("Curl femoral", "legs", "reps"),
]

# Cada ejercicio de rutina: series, reps objetivo, y cómo evoluciona.
#   kind "weight": carga de start a end (kg), redondeada a `step`
#   kind "bodyweight": reps de start a end, sin peso
#   kind "time": segundos de start a end, redondeados a `step`
ROUTINES = {
    "Tren superior 1": [
        dict(exercise="Press de banca", sets=4, reps=8, kind="weight", start=55, end=75, step=2.5),
        dict(exercise="Remo neutro", sets=3, reps=10, kind="weight", start=45, end=62.5, step=2.5),
        dict(exercise="Press militar", sets=3, reps=8, kind="weight", start=32.5, end=45, step=2.5),
        dict(exercise="Curl de bíceps", sets=3, reps=10, kind="weight", start=10, end=16, step=1),
        dict(exercise="Extensión de tríceps", sets=3, reps=12, kind="weight", start=20, end=30, step=2.5),
    ],
    "Tren inferior 1": [
        dict(exercise="Hip thrust", sets=4, reps=10, kind="weight", start=80, end=130, step=5),
        dict(exercise="Sentadilla en multipower", sets=4, reps=8, kind="weight", start=60, end=95, step=2.5),
        dict(exercise="Zancadas en multipower", sets=3, reps=10, kind="weight", start=30, end=50, step=2.5),
        dict(exercise="Extensión de cuádriceps", sets=3, reps=12, kind="weight", start=35, end=55, step=2.5),
        dict(exercise="Elevación de talones", sets=4, reps=15, kind="weight", start=40, end=70, step=5),
    ],
    "Tren superior 2": [
        dict(exercise="Jalón al pecho", sets=4, reps=10, kind="weight", start=45, end=62.5, step=2.5),
        dict(exercise="Press inclinado", sets=3, reps=10, kind="weight", start=18, end=26, step=2),
        dict(exercise="Remo abierto", sets=3, reps=10, kind="weight", start=40, end=55, step=2.5),
        dict(exercise="Face pull", sets=3, reps=15, kind="weight", start=15, end=22.5, step=2.5),
        dict(exercise="Elevaciones laterales", sets=3, reps=12, kind="weight", start=7, end=11, step=1),
    ],
    "Tren inferior 2": [
        dict(exercise="Peso muerto rumano", sets=4, reps=8, kind="weight", start=60, end=90, step=2.5),
        dict(exercise="Sentadilla búlgara", sets=3, reps=10, kind="weight", start=12, end=22, step=2),
        dict(exercise="Abducción", sets=3, reps=15, kind="weight", start=40, end=60, step=5),
        dict(exercise="Aducción", sets=3, reps=15, kind="weight", start=35, end=55, step=5),
        dict(exercise="Curl femoral", sets=3, reps=12, kind="weight", start=35, end=50, step=2.5),
    ],
}

WEEKLY = {0: "Tren superior 1", 1: "Tren inferior 1", 3: "Tren superior 2", 4: "Tren inferior 2"}  # lunes=0


def round_to(value, step):
    return round(round(value / step) * step, 2)


def progress(t):
    """Curva de progreso 0→1: rápida al principio, más lenta después."""
    return 1 - math.exp(-2.2 * t) if t > 0 else 0.0


def generate(end: date, seed: int):
    rng = random.Random(seed)
    start = end - timedelta(days=364)
    total_days = (end - start).days

    flu = (date(end.year if end.month > 1 else end.year - 1, 1, 12), 9)  # 9 días sin entrenar en enero
    vacation_year = end.year if end.month > 8 else end.year - 1
    vacation = (date(vacation_year, 8, 4), 16)  # dos semanas largas en agosto

    def is_off(day):
        for first, length in (flu, vacation):
            if first <= day < first + timedelta(days=length):
                return True
        return False

    workouts = []
    day = start
    while day <= end:
        routine = WEEKLY.get(day.weekday())
        week = (day - start).days // 7
        if routine and not is_off(day):
            skip = 0.08
            if rng.random() >= skip:
                workouts.append(make_workout(rng, day, routine, (day - start).days / total_days, week))
        day += timedelta(days=1)
    return workouts


def make_workout(rng, day, routine, t, week):
    deload = week % 8 == 7
    hour = rng.choice([7, 18, 18, 19, 19, 20])
    when = datetime.combine(day, time(hour, rng.choice([0, 15, 30, 45])), tzinfo=timezone.utc)

    entries = []
    for item in ROUTINES[routine]:
        p = min(1.0, max(0.0, progress(t) + rng.uniform(-0.04, 0.04)))
        target = item["start"] + (item["end"] - item["start"]) * p
        sets = []
        for index in range(item["sets"]):
            last = index == item["sets"] - 1
            if item["kind"] == "weight":
                weight = round_to(target * (0.85 if deload else 1.0), item["step"])
                reps = item["reps"] - (1 if last and rng.random() < 0.35 else 0)
                sets.append({"reps": reps, "weight": weight})
            elif item["kind"] == "bodyweight":
                reps = max(1, round(target) - (index // 2) - (1 if last and rng.random() < 0.4 else 0))
                sets.append({"reps": reps})
            else:
                seconds = round_to(target * (0.9 if deload else 1.0), item["step"])
                if last and rng.random() < 0.3:
                    seconds = max(item["step"], seconds - item["step"])
                sets.append({"duration": seconds})
        entries.append({"exercise": item["exercise"], "sets": sets})

    workout = {"date": when.strftime("%Y-%m-%dT%H:%M:%SZ"), "routine": routine, "exercises": entries}
    if deload:
        workout["notes"] = "Semana de descarga"
    return workout


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--end", type=date.fromisoformat, default=date.today() - timedelta(days=1))
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()

    backup = {
        "version": 1,
        "exercises": [{"name": n, "muscleGroup": g, "trackingType": k} for n, g, k in EXERCISES],
        "routines": [
            {
                "name": name,
                "items": [
                    {k: v for k, v in {
                        "exercise": item["exercise"],
                        "sets": item["sets"],
                        "reps": item["reps"] if item["kind"] != "time" else None,
                        "duration": item["start"] if item["kind"] == "time" else None,
                    }.items() if v is not None}
                    for item in items
                ],
            }
            for name, items in ROUTINES.items()
        ],
        "workouts": generate(args.end, args.seed),
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    # Un entreno por línea: legible y sin inflar el tamaño.
    lines = ",\n    ".join(json.dumps(w, ensure_ascii=False, separators=(",", ":")) for w in backup["workouts"])
    header = json.dumps({k: v for k, v in backup.items() if k != "workouts"}, ensure_ascii=False, indent=2)
    text = header[:-2] + ',\n  "workouts": [\n    ' + lines + "\n  ]\n}\n"
    args.output.write_text(text, encoding="utf-8")

    sets = sum(len(e["sets"]) for w in backup["workouts"] for e in w["exercises"])
    print(f"{args.output}: {len(backup['workouts'])} entrenos, {sets} series, "
          f"{backup['workouts'][0]['date'][:10]} → {backup['workouts'][-1]['date'][:10]}")


if __name__ == "__main__":
    main()
