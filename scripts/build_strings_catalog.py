#!/usr/bin/env python3
"""Genera GymApp/Localizable.xcstrings (castellano como idioma base + catalán).

Las claves son los textos en castellano tal y como aparecen en el código; las
interpolaciones de enteros son %lld y las de texto %@.
Para añadir o corregir una traducción, edita los diccionarios de abajo y ejecuta:
    python3 scripts/build_strings_catalog.py
"""

import json
from pathlib import Path

OUTPUT = Path(__file__).resolve().parent.parent / "GymApp" / "Localizable.xcstrings"

# Clave en castellano → catalán
CA = {
    # Pestañas y títulos
    "Calendario": "Calendari",
    "Rutinas": "Rutines",
    "Ejercicios": "Exercicis",
    "Progreso": "Progrés",
    "Ajustes": "Configuració",
    "Resumen": "Resum",
    "Historial": "Historial",
    "Nuevo entreno": "Nou entrenament",
    "Nueva rutina": "Nova rutina",
    "Nuevo ejercicio": "Nou exercici",
    "Editar ejercicio": "Editar exercici",
    "Añadir ejercicio": "Afegir exercici",
    "Añadir ejercicios": "Afegir exercicis",
    "Duración": "Durada",

    # Botones comunes
    "OK": "D’acord",
    "Cancelar": "Cancel·lar",
    "Cerrar": "Tancar",
    "Guardar": "Desar",
    "Finalizar": "Finalitzar",
    "Listo": "Fet",
    "Eliminar": "Eliminar",
    "Borrar": "Esborrar",
    "Quitar": "Treure",
    "Descartar": "Descartar",
    "Añadir": "Afegir",
    "Añadir (%lld)": "Afegir (%lld)",
    "Error": "Error",

    # Ajustes
    "Apariencia": "Aparença",
    "Sistema": "Sistema",
    "Claro": "Clar",
    "Oscuro": "Fosc",
    "Color principal": "Color principal",
    "Se usa en botones, pestañas, el calendario y las gráficas.": "S’utilitza als botons, a les pestanyes, al calendari i als gràfics.",
    "Azul": "Blau",
    "Índigo": "Indi",
    "Morado": "Lila",
    "Rosa": "Rosa",
    "Rojo": "Vermell",
    "Naranja": "Taronja",
    "Verde": "Verd",
    "Menta": "Menta",
    "Turquesa": "Turquesa",
    "Idioma": "Idioma",
    "La app está en castellano y catalán, y usa el idioma de tu iPhone. Para cambiarlo solo en esta app, pulsa aquí y elige Idioma.":
        "L’app està en castellà i català, i fa servir l’idioma del teu iPhone. Per canviar-lo només en aquesta app, toca aquí i tria Idioma.",
    "Versión": "Versió",

    # Herramientas de desarrollo
    "Desarrollo": "Desenvolupament",
    "Cargar datos de prueba (último año)": "Carregar dades de prova (últim any)",
    "Importar datos desde archivo…": "Importar dades des d’un fitxer…",
    "Borrar entrenos y rutinas": "Esborrar entrenaments i rutines",
    "Ocultar herramientas de desarrollo": "Amagar les eines de desenvolupament",
    "No se pudo abrir el archivo": "No s’ha pogut obrir el fitxer",
    "Archivo no válido": "Fitxer no vàlid",
    "Reemplazar mis datos": "Substituir les meves dades",
    "Añadir a los existentes": "Afegir als existents",
    "¿Borrar todos los entrenos y rutinas?": "Vols esborrar tots els entrenaments i rutines?",
    "Los ejercicios se conservan. No se puede deshacer.": "Els exercicis es conserven. No es pot desfer.",
    "Entrenos y rutinas borrados.": "S’han esborrat els entrenaments i les rutines.",
    "%lld entrenos y %lld series importados. Nuevos: %lld ejercicios, %lld rutinas.":
        "%lld entrenaments i %lld sèries importats. Nous: %lld exercicis, %lld rutines.",

    # Calendario
    "Mes anterior": "Mes anterior",
    "Mes siguiente": "Mes següent",
    "Vuelve al mes actual": "Torna al mes actual",
    "Con entreno": "Amb entrenament",
    "Sin entrenos este día": "Cap entrenament aquest dia",
    "Ver comparación": "Veure la comparació",
    "¿Eliminar este entreno?": "Vols eliminar aquest entrenament?",
    "Se borrarán todas sus series. No se puede deshacer.": "S’esborraran totes les sèries. No es pot desfer.",
    "En curso": "En curs",
    "Registrar entrenamiento": "Registrar entrenament",

    # Empezar entreno
    "Entrenamiento libre": "Entrenament lliure",
    "Añade los ejercicios sobre la marcha": "Afegeix els exercicis sobre la marxa",
    "Empezado %@": "Començat %@",
    "%@ · Última vez: %@": "%@ · Última vegada: %@",
    "Aún no tienes rutinas": "Encara no tens rutines",
    "Créalas en la pestaña Rutinas, o empieza un entrenamiento libre.": "Crea-les a la pestanya Rutines, o comença un entrenament lliure.",

    # Editor de entreno
    "Fecha": "Data",
    "Notas": "Notes",
    "Añadir serie": "Afegir sèrie",
    "Quitar ejercicio": "Treure l’exercici",
    "¿Quitar este ejercicio?": "Vols treure aquest exercici?",
    "¿Descartar este entreno?": "Vols descartar aquest entrenament?",
    "Se perderán las series que hayas anotado.": "Es perdran les sèries que hagis anotat.",
    "Última vez (%@): %@": "Última vegada (%@): %@",
    "Opciones de %@": "Opcions de %@",
    "Ejercicio": "Exercici",
    "Serie %lld": "Sèrie %lld",
    "Duración %@": "Durada %@",
    "sin anotar": "sense anotar",
    "Iniciar cronómetro": "Iniciar el cronòmetre",
    "Parar cronómetro": "Aturar el cronòmetre",
    "Minutos": "Minuts",
    "Segundos": "Segons",

    # Resumen
    "¡Entreno completado!": "Entrenament completat!",
    "Comparado con tu entreno del %@": "Comparat amb el teu entrenament del %@",
    "Primera vez con esta rutina: cada ejercicio se compara con la última vez que lo hiciste.":
        "Primera vegada amb aquesta rutina: cada exercici es compara amb l’última vegada que el vas fer.",
    "Cada ejercicio se compara con la última vez que lo hiciste.": "Cada exercici es compara amb l’última vegada que el vas fer.",
    "Volumen": "Volum",
    "Series": "Sèries",
    "Repeticiones": "Repeticions",
    "Tiempo": "Temps",
    "¡Nuevo récord personal!": "Nou rècord personal!",
    "Superas tu mejor marca de siempre.": "Superes la teva millor marca de sempre.",
    "Volumen por ejercicio": "Volum per exercici",
    "Entreno": "Entrenament",
    "Hoy": "Avui",
    "Anterior": "Anterior",
    "Primera vez": "Primera vegada",
    "Récord": "Rècord",
    "Hoy: %@": "Avui: %@",
    "Nuevo": "Nou",
    "Igual": "Igual",
    "Sube %@": "Puja %@",
    "Baja %@": "Baixa %@",
    "Igual que la vez anterior": "Igual que l’última vegada",
    "Sin datos anteriores": "Sense dades anteriors",
    "Récord de peso": "Rècord de pes",
    "Récord de 1RM": "Rècord de 1RM",
    "Récord de repeticiones": "Rècord de repeticions",
    "Récord de tiempo": "Rècord de temps",

    # Rutinas
    "Nombre": "Nom",
    "Ej. Torso, Pierna, Empuje…": "P. ex. Tors, Cama, Empenta…",
    "Pulsa Editar para cambiar el orden.": "Toca Edita per canviar l’ordre.",
    "%@ por serie": "%@ per sèrie",
    "Rutina sin nombre": "Rutina sense nom",
    "Sin ejercicios": "Sense exercicis",
    "Sin rutinas": "Sense rutines",
    "Crea una rutina con los ejercicios que sueles hacer juntos.": "Crea una rutina amb els exercicis que acostumes a fer junts.",
    "Crear rutina": "Crear rutina",
    "¿Eliminar esta rutina?": "Vols eliminar aquesta rutina?",
    "Los entrenos que ya hiciste con ella se conservan.": "Els entrenaments que ja hi vas fer es conserven.",
    "Buscar ejercicio": "Cercar exercici",
    "por tiempo": "per temps",

    # Ejercicios
    "Nombre del ejercicio": "Nom de l’exercici",
    "Grupo muscular": "Grup muscular",
    "Se mide por": "Es mesura per",
    "Técnica, ajustes de la máquina…": "Tècnica, ajustos de la màquina…",
    "En cada serie anotarás repeticiones y peso.": "A cada sèrie anotaràs repeticions i pes.",
    "En cada serie anotarás la duración, con cronómetro, y un peso opcional (lastre, disco…).":
        "A cada sèrie anotaràs la durada, amb cronòmetre, i un pes opcional (llast, disc…).",
    "Cambiar el tipo no convierte las series ya registradas.": "Canviar el tipus no converteix les sèries ja registrades.",
    "Añade tu primer ejercicio con +.": "Afegeix el teu primer exercici amb +.",
    "Eliminar ejercicio e historial": "Eliminar l’exercici i l’historial",
    "¿Eliminar este ejercicio?": "Vols eliminar aquest exercici?",
    "Entrenos con este ejercicio: %lld. Rutinas: %lld. Se borrará también su historial y no se puede deshacer.":
        "Entrenaments amb aquest exercici: %lld. Rutines: %lld. També s’esborrarà el seu historial i no es pot desfer.",
    "Pecho": "Pit",
    "Espalda": "Esquena",
    "Hombros": "Espatlles",
    "Bíceps": "Bíceps",
    "Tríceps": "Tríceps",
    "Piernas": "Cames",
    "Glúteos": "Glutis",
    "Core": "Core",
    "Cardio": "Cardio",
    "Otros": "Altres",

    # Progreso
    "Aún no hay progreso": "Encara no hi ha progrés",
    "Cuando finalices entrenos, aquí verás la evolución de cada ejercicio.": "Quan finalitzis entrenaments, aquí veuràs l’evolució de cada exercici.",
    "Métrica": "Mètrica",
    "Periodo": "Període",
    "Peso máx.": "Pes màx.",
    "1RM est.": "1RM est.",
    "Reps": "Reps",
    "Duración máx.": "Durada màx.",
    "Tiempo total": "Temps total",
    "3M": "3M",
    "6M": "6M",
    "1A": "1A",
    "Todo": "Tot",
    "desde el %@": "des del %@",
    "Sin datos en este periodo": "Sense dades en aquest període",
    "Evolución de %@": "Evolució de %@",
    "Récords personales": "Rècords personals",
    "Mejor peso": "Millor pes",
    "1RM estimado": "1RM estimat",
    "Más volumen": "Més volum",
    "Más reps en una serie": "Més reps en una sèrie",
    "Mejor tiempo": "Millor temps",
    "Sesiones": "Sessions",
    "Sin series": "Sense sèries",

    # Ejercicios precargados
    "Press de banca": "Press de banca",
    "Press inclinado con mancuernas": "Press inclinat amb manuelles",
    "Aperturas con mancuernas": "Obertures amb manuelles",
    "Fondos en paralelas": "Fons a paral·leles",
    "Flexiones": "Flexions",
    "Dominadas": "Dominades",
    "Remo con barra": "Rem amb barra",
    "Jalón al pecho": "Jaló al pit",
    "Remo en polea baja": "Rem a la politja baixa",
    "Peso muerto": "Pes mort",
    "Press militar": "Press militar",
    "Elevaciones laterales": "Elevacions laterals",
    "Face pull": "Face pull",
    "Curl con barra": "Curl amb barra",
    "Curl martillo": "Curl martell",
    "Press francés": "Press francès",
    "Extensión de tríceps en polea": "Extensió de tríceps a la politja",
    "Sentadilla": "Esquat",
    "Prensa de piernas": "Premsa de cames",
    "Zancadas": "Gambades",
    "Extensión de cuádriceps": "Extensió de quàdriceps",
    "Curl femoral": "Curl femoral",
    "Elevación de gemelos": "Elevació de bessons",
    "Hip thrust": "Hip thrust",
    "Peso muerto rumano": "Pes mort romanès",
    "Plancha": "Planxa",
    "Plancha lateral": "Planxa lateral",
    "Crunch abdominal": "Crunch abdominal",
    "Elevación de piernas colgado": "Elevació de cames penjat",
    "Cinta de correr": "Cinta de córrer",
    "Bicicleta estática": "Bicicleta estàtica",
    "Remo ergómetro": "Rem ergòmetre",
    "Saltar a la comba": "Saltar a corda",

    # Rutinas y notas de los datos de prueba
    "Empuje": "Empenta",
    "Tirón": "Estirada",
    "Pierna": "Cama",
    "Cardio y core": "Cardio i core",
    "Torso": "Tors",
    "Semana de descarga": "Setmana de descàrrega",
}

# Claves con número: formas singular/plural en castellano y catalán
PLURALS = {
    "%lld ejercicios": (("%lld ejercicio", "%lld ejercicios"), ("%lld exercici", "%lld exercicis")),
    "%lld series": (("%lld serie", "%lld series"), ("%lld sèrie", "%lld sèries")),
    "%lld repeticiones": (("%lld repetición", "%lld repeticiones"), ("%lld repetició", "%lld repeticions")),
    "%lld sesiones": (("%lld sesión", "%lld sesiones"), ("%lld sessió", "%lld sessions")),
    "%lld reps": (("%lld rep", "%lld reps"), ("%lld rep", "%lld reps")),
    "Ya tienes %lld entrenos": (("Ya tienes %lld entreno", "Ya tienes %lld entrenos"),
                                ("Ja tens %lld entrenament", "Ja tens %lld entrenaments")),
    "¡%lld nuevos récords personales!": (("¡%lld nuevo récord personal!", "¡%lld nuevos récords personales!"),
                                         ("%lld nou rècord personal!", "%lld nous rècords personals!")),
    "El archivo trae %lld entrenos. ¿Quieres reemplazar los actuales o añadirlos?": (
        ("El archivo trae %lld entreno. ¿Quieres reemplazar los actuales o añadirlo?",
         "El archivo trae %lld entrenos. ¿Quieres reemplazar los actuales o añadirlos?"),
        ("El fitxer porta %lld entrenament. Vols substituir els actuals o afegir-lo?",
         "El fitxer porta %lld entrenaments. Vols substituir els actuals o afegir-los?")),
    "%lld entrenos guardados. El archivo debe ser un JSON con el formato descrito en el README.": (
        ("%lld entreno guardado. El archivo debe ser un JSON con el formato descrito en el README.",
         "%lld entrenos guardados. El archivo debe ser un JSON con el formato descrito en el README."),
        ("%lld entrenament desat. El fitxer ha de ser un JSON amb el format descrit al README.",
         "%lld entrenaments desats. El fitxer ha de ser un JSON amb el format descrit al README.")),
}

# Claves que no se traducen (números, unidades, separadores)
UNTRANSLATED = ["%lld", "%@ · %@", "%@: %@", "%lld min", "%lld s", "kg", "reps", "0", "—"]


def unit(value):
    return {"stringUnit": {"state": "translated", "value": value}}


def plural(one, other):
    return {"variations": {"plural": {"one": unit(one), "other": unit(other)}}}


def main():
    strings = {}
    for key, ca in CA.items():
        strings[key] = {"localizations": {"ca": unit(ca)}}
    for key, (es, ca) in PLURALS.items():
        strings[key] = {"localizations": {"es": plural(*es), "ca": plural(*ca)}}
    for key in UNTRANSLATED:
        strings[key] = {"shouldTranslate": False}

    catalog = {"sourceLanguage": "es", "strings": dict(sorted(strings.items())), "version": "1.0"}
    OUTPUT.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{OUTPUT}: {len(strings)} claves")


if __name__ == "__main__":
    main()
