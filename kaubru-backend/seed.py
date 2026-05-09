"""
Seed script - run once to populate the database with sample data.
Usage:  python seed.py
"""

from app.database import SessionLocal, engine
from app import models
from app.auth import hash_password

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# --- Words / Dictionary -------------------------------------------------------

WORDS = [
    # Greetings
    {"english": "hello", "kaubru": "Hoh", "category": "greetings",
     "example_english": "Hello, how are you?", "example_kaubru": "Hoh, kaham de tong?"},
    {"english": "goodbye", "kaubru": "bye", "category": "greetings",
     "example_english": "Goodbye, see you tomorrow.", "example_kaubru": "Bye, khnai malai phi na"},
    {"english": "thank you", "kaubru": "khachang ha", "category": "greetings",
     "example_english": "Thank you very much.", "example_kaubru": "betha khe khachangha."},
    {"english": "yes", "kaubru": "em", "category": "greetings",
     "example_english": "Yes, I understand.", "example_kaubru": "em, ang mchi ou/ha."},
    {"english": "no", "kaubru": "ehi", "category": "greetings",
     "example_english": "No, I don't know.", "example_kaubru": "ehi, cya ang pho"},
    {"english": "how are you", "kaubru": "kaham de tong?", "category": "greetings",
     "example_english": "How are you today?", "example_kaubru": "kaham de tong tini le?"},
    {"english": "what is your name", "kaubru": "nini mmung kma?", "category": "greetings",
     "example_english": "What is your name?", "example_kaubru": "Nini mmung kma?"},
    {"english": "my name is", "kaubru": "aini mmung khe ", "category": "greetings",
     "example_english": "My name is Raju.", "example_kaubru": "Aini mmung khe Raju."},

    # Family
    {"english": "mother", "kaubru": "among/mma", "category": "family",
     "example_english": "My mother is kind.", "example_kaubru": "Aini mma le brouh kaham ma sei."},
    {"english": "father", "kaubru": "apa/mpha", "category": "family",
     "example_english": "My father works hard.", "example_kaubru": "Aini mpha le samung tang grao sei."},
    {"english": "brother", "kaubru": "mta/ata", "category": "family",
     "example_english": "My brother is tall.", "example_kaubru": "aini mta le klau ma sei."},
    {"english": "sister", "kaubru": "mbi/aibi", "category": "family",
     "example_english": "My sister sings well.", "example_kaubru": "aini mbi le rcha krung ma sei"},
    {"english": "child", "kaubru": "chrai msa", "category": "family",
     "example_english": "The child is playing.", "example_kaubru": "chraiha rao thung pai tong ou"},
    {"english": "family", "kaubru": "nouhkhung", "category": "family",
     "example_english": "My family is big.", "example_kaubru": "aini le nouhkhung ktor sei."},

    # Nature / Environment
    {"english": "sky", "kaubru": "nouhkha", "category": "nature",
     "example_english": "The sky is blue.", "example_kaubru": "nouhkha somkhrang ha."},
    {"english": "rain", "kaubru": "watoi", "category": "nature",
     "example_english": "It is raining.", "example_kaubru": "watoi tong ha."},
    {"english": "wind", "kaubru": "nouhba", "category": "nature",
     "example_english": "The wind is strong.", "example_kaubru": "nouhba phaingnang ha."},
    {"english": "cloud", "kaubru": "chumoing", "category": "nature",
     "example_english": "The clouds are white.", "example_kaubru": "chumoing kphuih ha."},
    {"english": "stone", "kaubru": "klongthai", "category": "nature",
     "example_english": "The stone is hard.", "example_kaubru": "klongthai kraoh ha."},
    {"english": "rock", "kaubru": "klongthai ktor", "category": "nature",
     "example_english": "There is a big rock.", "example_kaubru": "klongthai ktor tong ha."},
    {"english": "soil", "kaubru": "ha", "category": "nature",
     "example_english": "The soil is good.", "example_kaubru": "ha kaham ha."},
    {"english": "flower", "kaubru": "khumba", "category": "nature",
     "example_english": "The flower is beautiful.", "example_kaubru": "khumba nythau ha."},

    # Animals
    {"english": "bird", "kaubru": "tao", "category": "animals",
     "example_english": "The bird is singing.", "example_kaubru": "tao rcha tong ha."},
    {"english": "fish", "kaubru": "aah", "category": "animals",
     "example_english": "The fish is in the river.", "example_kaubru": "aah tui-sa se tong ha."},
    {"english": "animal", "kaubru": "moimai", "category": "animals",
     "example_english": "Many animals live in the forest.", "example_kaubru": "blong se moimai betha tong ha."},
    {"english": "dog", "kaubru": "soi", "category": "animals",
     "example_english": "The dog is running.", "example_kaubru": "soi khai tong ha."},
    {"english": "cat", "kaubru": "bilai", "category": "animals",
     "example_english": "The cat is sleeping.", "example_kaubru": "bilai thu tong ha."},
    {"english": "cow", "kaubru": "msu", "category": "animals",
     "example_english": "The cow is in the field.", "example_kaubru": "msu tong ha."},
    {"english": "pig", "kaubru": "wouh", "category": "animals",
     "example_english": "They raise pigs.", "example_kaubru": "brao wouh tong ha."},
    {"english": "chicken", "kaubru": "taolas", "category": "animals",
     "example_english": "The chicken is in the yard.", "example_kaubru": "taolas tong ha."},
    {"english": "snake", "kaubru": "chubu", "category": "animals",
     "example_english": "There is a snake in the forest.", "example_kaubru": "blong se chubu tong ha."},
    {"english": "tiger", "kaubru": "msa mtr", "category": "animals",
     "example_english": "The tiger is strong.", "example_kaubru": "msa mtr phaingnang ha."},
    {"english": "elephant", "kaubru": "mayoung", "category": "animals",
     "example_english": "The elephant is big.", "example_kaubru": "mayoung ktor ha."},
    # Nature / Daily
    {"english": "water", "kaubru": "tui", "category": "nature",
     "example_english": "I need water.", "example_kaubru": "ang tui nang tong ha."},
    {"english": "rice", "kaubru": "mairung", "category": "food",
     "example_english": "Rice is our staple food.", "example_kaubru": "Mairung sei chini sal boini mai."},
    {"english": "house", "kaubru": "nouh", "category": "places",
     "example_english": "I am going home.", "example_kaubru": "Ang nouh thang gra nu."},
    {"english": "fire", "kaubru": "hor", "category": "nature",
     "example_english": "The fire is burning.", "example_kaubru": "hor kham tong ha."},
    {"english": "sun", "kaubru": "sal", "category": "nature",
     "example_english": "The sun is bright.", "example_kaubru": "sal kara ha."},
    {"english": "moon", "kaubru": "tal", "category": "nature",
     "example_english": "The moon is beautiful.", "example_kaubru": "tal nythau ha."},
    {"english": "river", "kaubru": "tui-sa", "category": "nature",
     "example_english": "The river flows fast.", "example_kaubru": "Tui-sa betha khe hiolkhlai ha."},
    {"english": "tree", "kaubru": "mphang", "category": "nature",
     "example_english": "The tree is tall.", "example_kaubru": "bo mphang le klao ha le."},

    # Numbers (1-10, corrected to match traditional KauBru counting system)
    {"english": "one", "kaubru": "ha", "category": "numbers",
     "example_english": "One apple.", "example_kaubru": "thaiha appel"},
    {"english": "two", "kaubru": "knoi", "category": "numbers",
     "example_english": "Two birds.", "example_kaubru": "kenoi tao."},
    {"english": "three", "kaubru": "ktham", "category": "numbers",
     "example_english": "Three children.", "example_kaubru": "chrai rao khrauktham."},
    {"english": "four", "kaubru": "broi", "category": "numbers",
     "example_english": "Four houses.", "example_kaubru": "nouh kebroi."},
    {"english": "five", "kaubru": "ba", "category": "numbers",
     "example_english": "Five rivers.", "example_kaubru": "keba tuisa."},
    {"english": "six", "kaubru": "douh", "category": "numbers",
     "example_english": "Six people.", "example_kaubru": "brouh kedouh."},
    {"english": "seven", "kaubru": "sning", "category": "numbers",
     "example_english": "Seven days.", "example_kaubru": "sal kesning."},
    {"english": "eight", "kaubru": "chaih", "category": "numbers",
     "example_english": "Eight birds.", "example_kaubru": "tao kechaih."},
    {"english": "nine", "kaubru": "skuh", "category": "numbers",
     "example_english": "Nine trees.", "example_kaubru": "mphang keskuk."},
    {"english": "ten", "kaubru": "chi", "category": "numbers",
     "example_english": "Ten days.", "example_kaubru": "sal chi."},
    {"english": "twenty", "kaubru": "khol", "category": "numbers",
     "example_english": "Twenty people.", "example_kaubru": "brouh khol."},
    {"english": "forty", "kaubru": "kurnoi", "category": "numbers",
     "example_english": "Forty days.", "example_kaubru": "sal kurnoi."},
    {"english": "sixty", "kaubru": "kurtham", "category": "numbers",
     "example_english": "Sixty years.", "example_kaubru": "khnai kurtham."},
    {"english": "eighty", "kaubru": "kurbroi", "category": "numbers",
     "example_english": "Eighty people.", "example_kaubru": "brouh kurbroi."},
    {"english": "hundred", "kaubru": "rzaha", "category": "numbers",
     "example_english": "One hundred.", "example_kaubru": "rzaha."},

    # Mathematical operators
    {"english": "addition", "kaubru": "dalaomo", "category": "math",
     "example_english": "Addition is combining numbers.", "example_kaubru": "dalaomo le phang phang songpang."},
    {"english": "plus", "kaubru": "dalaomo", "category": "math",
     "example_english": "Three plus two.", "example_kaubru": "ktham dalaomo knoi."},
    {"english": "add", "kaubru": "dalaomo", "category": "math",
     "example_english": "Add five and three.", "example_kaubru": "ba dalaomo ktham."},
    {"english": "subtraction", "kaubru": "skaohmo", "category": "math",
     "example_english": "Subtraction takes away a number.", "example_kaubru": "skaohmo le phang phang baoh."},
    {"english": "minus", "kaubru": "skaohmo", "category": "math",
     "example_english": "Ten minus four.", "example_kaubru": "chi skaohmo broi."},
    {"english": "subtract", "kaubru": "skaohmo", "category": "math",
     "example_english": "Subtract two from five.", "example_kaubru": "ba skaohmo knoi."},
    {"english": "multiplication", "kaubru": "songpangmo", "category": "math",
     "example_english": "Multiplication repeats addition.", "example_kaubru": "songpangmo le dalaomo songpang."},
    {"english": "multiply", "kaubru": "songpangmo", "category": "math",
     "example_english": "Multiply three by four.", "example_kaubru": "ktham songpangmo broi."},
    {"english": "times", "kaubru": "songpangmo", "category": "math",
     "example_english": "Three times five.", "example_kaubru": "ktham songpangmo ba."},
    {"english": "division", "kaubru": "baohmo", "category": "math",
     "example_english": "Division splits a number.", "example_kaubru": "baohmo le phang phang baoh."},
    {"english": "divide", "kaubru": "baohmo", "category": "math",
     "example_english": "Divide ten by two.", "example_kaubru": "chi baohmo knoi."},

    # Geographical directions (hatinggol)
    {"english": "east", "kaubru": "salka", "category": "directions",
     "example_english": "The sun rises in the east.", "example_kaubru": "sal salka khe phai tong ha."},
    {"english": "west", "kaubru": "salthang", "category": "directions",
     "example_english": "The sun sets in the west.", "example_kaubru": "sal salthang khe thang tong ha."},
    {"english": "north", "kaubru": "hakang", "category": "directions",
     "example_english": "The river flows north.", "example_kaubru": "tuisa hakang thang tong ha."},
    {"english": "south", "kaubru": "aola", "category": "directions",
     "example_english": "The village is to the south.", "example_kaubru": "gram aola khe tong ha."},
    {"english": "direction", "kaubru": "hatinggol", "category": "directions",
     "example_english": "Which direction are you going?", "example_kaubru": "hatinggol mtoi thang ny nung ba?"},

    # Days of the week (Bar ni salmung)
    {"english": "sunday", "kaubru": "kaukti sal", "category": "days",
     "example_english": "Sunday is a rest day.", "example_kaubru": "kaukti sal le thung sal."},
    {"english": "monday", "kaubru": "tangra sal", "category": "days",
     "example_english": "Monday is the first day of the week.", "example_kaubru": "tangra sal le bar ni chisa sal."},
    {"english": "tuesday", "kaubru": "kraoh sal", "category": "days",
     "example_english": "Tuesday comes after Monday.", "example_kaubru": "kraoh sal le tangra sal phui phai tong ha."},
    {"english": "wednesday", "kaubru": "bdu sal", "category": "days",
     "example_english": "Wednesday is the middle of the week.", "example_kaubru": "bdu sal le bar ni kholphehchi sal."},
    {"english": "thursday", "kaubru": "songrong sal", "category": "days",
     "example_english": "Thursday comes before Friday.", "example_kaubru": "songrong sal le souhkra sal phui phai tong ha."},
    {"english": "friday", "kaubru": "souhkra sal", "category": "days",
     "example_english": "Friday is the last working day.", "example_kaubru": "souhkra sal le samung sal."},
    {"english": "saturday", "kaubru": "chani sal", "category": "days",
     "example_english": "Saturday is a holiday.", "example_kaubru": "chani sal le thung sal."},
    {"english": "week", "kaubru": "bar ni", "category": "days",
     "example_english": "There are seven days in a week.", "example_kaubru": "bar ni khe sal kesning tong ha."},
    {"english": "day", "kaubru": "sal", "category": "days",
     "example_english": "Today is a good day.", "example_kaubru": "tini sal le kaham sal."},

    # Months of the year (Borsa ni Talmung)
    {"english": "january", "kaubru": "khasoing tal", "category": "months",
     "example_english": "January is the first month.", "example_kaubru": "khasoing tal le borsa ni chisa tal."},
    {"english": "february", "kaubru": "phraing tal", "category": "months",
     "example_english": "February is the second month.", "example_kaubru": "phraing tal le borsa ni chingnoi tal."},
    {"english": "march", "kaubru": "choileing tal", "category": "months",
     "example_english": "March is the third month.", "example_kaubru": "choileing tal le borsa ni chiktham tal."},
    {"english": "april", "kaubru": "sajlang tal", "category": "months",
     "example_english": "April is the fourth month.", "example_kaubru": "sajlang tal le borsa ni chibroi tal."},
    {"english": "may", "kaubru": "asari tal", "category": "months",
     "example_english": "May is the fifth month.", "example_kaubru": "asari tal le borsa ni chara tal."},
    {"english": "june", "kaubru": "srao tal", "category": "months",
     "example_english": "June is the sixth month.", "example_kaubru": "srao tal le borsa ni chidouh tal."},
    {"english": "july", "kaubru": "drumboi tal", "category": "months",
     "example_english": "July is the seventh month.", "example_kaubru": "drumboi tal le borsa ni chisning tal."},
    {"english": "august", "kaubru": "keingrai tal", "category": "months",
     "example_english": "August is the eighth month.", "example_kaubru": "keingrai tal le borsa ni chichaih tal."},
    {"english": "september", "kaubru": "osa tal", "category": "months",
     "example_english": "September is the ninth month.", "example_kaubru": "osa tal le borsa ni chiskuh tal."},
    {"english": "october", "kaubru": "kehchi tal", "category": "months",
     "example_english": "October is the tenth month.", "example_kaubru": "kehchi tal le borsa ni chi tal."},
    {"english": "november", "kaubru": "maogru tal", "category": "months",
     "example_english": "November is the eleventh month.", "example_kaubru": "maogru tal le borsa ni chisa tal."},
    {"english": "december", "kaubru": "maosru tal", "category": "months",
     "example_english": "December is the twelfth month.", "example_kaubru": "maosru tal le borsa ni chingnoi tal."},
    {"english": "month", "kaubru": "tal", "category": "months",
     "example_english": "There are twelve months in a year.", "example_kaubru": "borsa khe tal chingnoi tong ha."},
    {"english": "year", "kaubru": "borsa", "category": "months",
     "example_english": "This year is good.", "example_kaubru": "tini borsa le kaham borsa."},
    {"english": "good", "kaubru": "kaham", "category": "adjectives",
     "example_english": "This is good.", "example_kaubru": "bo le kaham no."},
    {"english": "big", "kaubru": "ktor", "category": "adjectives",
     "example_english": "A big house.", "example_kaubru": "Nouh ktor."},
    {"english": "small", "kaubru": "ste", "category": "adjectives",
     "example_english": "A small bird.", "example_kaubru": "taopi."},
    {"english": "beautiful", "kaubru": "nythau", "category": "adjectives",
     "example_english": "She is beautiful.", "example_kaubru": "broi nythau sei."},
    {"english": "tall", "kaubru": "kchu", "category": "adjectives",
     "example_english": "He is tall.", "example_kaubru": "bung kchu ha."},
    {"english": "short", "kaubru": "bara", "category": "adjectives",
     "example_english": "She is short.", "example_kaubru": "bung bara ha."},
    {"english": "long", "kaubru": "klao", "category": "adjectives",
     "example_english": "The road is long.", "example_kaubru": "lama klao ha."},
    {"english": "new", "kaubru": "ktai", "category": "adjectives",
     "example_english": "This is a new house.", "example_kaubru": "bo nouh ktai ha."},
    {"english": "old", "kaubru": "kcham", "category": "adjectives",
     "example_english": "This is an old tree.", "example_kaubru": "bo mphang kcham ha."},
    {"english": "fast", "kaubru": "kdo", "category": "adjectives",
     "example_english": "The river flows fast.", "example_kaubru": "tui-sa kdo ha."},
    {"english": "slow", "kaubru": "kleh", "category": "adjectives",
     "example_english": "Walk slowly.", "example_kaubru": "kleh se hinng ro."},
    {"english": "strong", "kaubru": "phaingnang", "category": "adjectives",
     "example_english": "My father is strong.", "example_kaubru": "aini mpha phaingnang ha."},
    {"english": "weak", "kaubru": "phaingkroi", "category": "adjectives",
     "example_english": "He is weak today.", "example_kaubru": "bung tini phaingkroi ha."},
    {"english": "happy", "kaubru": "khachang", "category": "adjectives",
     "example_english": "I am happy.", "example_kaubru": "ang khachang ha."},
    {"english": "sad", "kaubru": "duhkho", "category": "adjectives",
     "example_english": "She is sad.", "example_kaubru": "bung duhkho ha."},
    {"english": "angry", "kaubru": "geing", "category": "adjectives",
     "example_english": "He is angry.", "example_kaubru": "bung geing ha."},
    {"english": "tired", "kaubru": "leing", "category": "adjectives",
     "example_english": "I am tired.", "example_kaubru": "ang leing ha."},
    {"english": "sick", "kaubru": "sori hamya", "category": "adjectives",
     "example_english": "She is sick.", "example_kaubru": "bung sori hamya ha."},
    {"english": "healthy", "kaubru": "sori kaham", "category": "adjectives",
     "example_english": "He is healthy.", "example_kaubru": "bung sori kaham ha."},
    {"english": "clean", "kaubru": "poriskar", "category": "adjectives",
     "example_english": "The water is clean.", "example_kaubru": "tui poriskar ha."},
    {"english": "dirty", "kaubru": "snuhha", "category": "adjectives",
     "example_english": "The road is dirty.", "example_kaubru": "lama snuhha ha."},
    {"english": "heavy", "kaubru": "hli", "category": "adjectives",
     "example_english": "This bag is heavy.", "example_kaubru": "bo hli ha."},
    {"english": "light", "kaubru": "hling", "category": "adjectives",
     "example_english": "This is light.", "example_kaubru": "bo hling ha."},
    {"english": "hard", "kaubru": "kraoh", "category": "adjectives",
     "example_english": "The stone is hard.", "example_kaubru": "bo kraoh ha."},
    {"english": "soft", "kaubru": "pkei", "category": "adjectives",
     "example_english": "The bed is soft.", "example_kaubru": "bo pkei ha."},
    {"english": "near", "kaubru": "sampha", "category": "adjectives",
     "example_english": "The school is near.", "example_kaubru": "iskul sampha ha."},
    {"english": "far", "kaubru": "hachal", "category": "adjectives",
     "example_english": "The market is far.", "example_kaubru": "bazaar hachal ha."},
    {"english": "right", "kaubru": "gothe ow", "category": "adjectives",
     "example_english": "That is right.", "example_kaubru": "bo gothe ow ha."},
    {"english": "wrong", "kaubru": "gothe ya", "category": "adjectives",
     "example_english": "That is wrong.", "example_kaubru": "bo gothe ya ha."},

    # Pronouns (confirmed from grammar book)
    {"english": "i", "kaubru": "ang", "category": "pronouns",
     "example_english": "I am going home.", "example_kaubru": "ang nouh thang gra nu."},
    {"english": "we", "kaubru": "chung", "category": "pronouns",
     "example_english": "We are going.", "example_kaubru": "chung thang gra nu."},
    {"english": "you", "kaubru": "nung", "category": "pronouns",
     "example_english": "You come daily.", "example_kaubru": "nung khe salboi se phai ou."},
    {"english": "you all", "kaubru": "nrao", "category": "pronouns",
     "example_english": "You all come.", "example_kaubru": "nrao phai ou."},
    {"english": "he", "kaubru": "bung", "category": "pronouns",
     "example_english": "He is coming.", "example_kaubru": "bung phai ou."},
    {"english": "she", "kaubru": "bung", "category": "pronouns",
     "example_english": "She always comes.", "example_kaubru": "bung dophe dophe se phai ou."},
    {"english": "they", "kaubru": "brao", "category": "pronouns",
     "example_english": "They have eaten food.", "example_kaubru": "brao mai cha ha."},
    {"english": "my", "kaubru": "aini", "category": "pronouns",
     "example_english": "My house is big.", "example_kaubru": "aini nouh ktor ha."},
    {"english": "your", "kaubru": "nini", "category": "pronouns",
     "example_english": "Your name is good.", "example_kaubru": "nini mmung kaham ha."},
    {"english": "his", "kaubru": "bini", "category": "pronouns",
     "example_english": "His father came.", "example_kaubru": "bini mpha phai ou."},
    {"english": "her", "kaubru": "bini", "category": "pronouns",
     "example_english": "Her mother is here.", "example_kaubru": "bini mma di tong ha."},

    # Time words (confirmed from grammar book)
    {"english": "yesterday", "kaubru": "mia", "category": "time",
     "example_english": "Yesterday my brother came.", "example_kaubru": "mia aini ata phai ou."},
    {"english": "today", "kaubru": "tini", "category": "time",
     "example_english": "Today is a good day.", "example_kaubru": "tini sal kaham ha."},
    {"english": "now", "kaubru": "taoh", "category": "time",
     "example_english": "Now we have eaten food.", "example_kaubru": "taoh wo khe chung mai cha ha."},
    {"english": "daily", "kaubru": "salboi", "category": "time",
     "example_english": "You come daily.", "example_kaubru": "nung khe salboi se phai ou."},
    {"english": "always", "kaubru": "jug", "category": "time",
     "example_english": "I always come home.", "example_kaubru": "ang khebu jug se nouh wo phai ou."},
    {"english": "tomorrow", "kaubru": "khnai", "category": "time",
     "example_english": "See you tomorrow.", "example_kaubru": "khnai malai phi na."},

    {"english": "morning", "kaubru": "phuaing", "category": "time",
     "example_english": "Good morning!", "example_kaubru": "phuaing kaham!"},
    {"english": "afternoon", "kaubru": "saja", "category": "time",
     "example_english": "Good afternoon!", "example_kaubru": "saja kaham!"},
    {"english": "evening", "kaubru": "saroi", "category": "time",
     "example_english": "Good evening!", "example_kaubru": "saroi kaham!"},
    {"english": "night", "kaubru": "hor", "category": "time",
     "example_english": "Good night!", "example_kaubru": "hor kaham!"},
    {"english": "hour", "kaubru": "gonta ha", "category": "time",
     "example_english": "Wait one hour.", "example_kaubru": "gonta ha nysing di."},
    {"english": "minute", "kaubru": "minit", "category": "time",
     "example_english": "Wait a minute.", "example_kaubru": "minit ha nysing di."},
    {"english": "early", "kaubru": "do ha", "category": "time",
     "example_english": "Come early.", "example_kaubru": "do ha phai di."},
    {"english": "late", "kaubru": "somoing lai ha", "category": "time",
     "example_english": "He came late.", "example_kaubru": "bung somoing lai ha phai ou."},
    {"english": "before", "kaubru": "skang", "category": "time",
     "example_english": "Come before noon.", "example_kaubru": "saja skang phai di."},
    {"english": "after", "kaubru": "apai ye", "category": "time",
     "example_english": "Come after eating.", "example_kaubru": "mai cha apai ye phai di."},
    {"english": "soon", "kaubru": "phut", "category": "time",
     "example_english": "Come soon.", "example_kaubru": "phut khe phai di."},
    {"english": "long ago", "kaubru": "ake phut", "category": "time",
     "example_english": "This happened long ago.", "example_kaubru": "bo ake phut tong ha."},
    {"english": "last year", "kaubru": "semai", "category": "time",
     "example_english": "Last year was good.", "example_kaubru": "semai borsa kaham ha."},
    {"english": "next year", "kaubru": "khali", "category": "time",
     "example_english": "Next year we will go.", "example_kaubru": "khali chung thang nai."},
    # Kinship / family address (confirmed from grammar book)
    {"english": "my father", "kaubru": "apa", "category": "family",
     "example_english": "My father is kind.", "example_kaubru": "apa kaham ha."},
    {"english": "my mother", "kaubru": "amou", "category": "family",
     "example_english": "My mother is here.", "example_kaubru": "amou di tong ha."},
    {"english": "my elder brother", "kaubru": "ata", "category": "family",
     "example_english": "My elder brother came.", "example_kaubru": "ata phai ou."},
    {"english": "my elder sister", "kaubru": "aibi", "category": "family",
     "example_english": "My elder sister is beautiful.", "example_kaubru": "aibi nythau ha."},
    {"english": "my younger brother", "kaubru": "angphaiyong", "category": "family",
     "example_english": "My younger brother is small.", "example_kaubru": "angphaiyong ste ha."},
    {"english": "my younger sister", "kaubru": "anghanao", "category": "family",
     "example_english": "My younger sister is good.", "example_kaubru": "anghanao kaham ha."},
    {"english": "my grandfather", "kaubru": "achwu", "category": "family",
     "example_english": "My grandfather is old.", "example_kaubru": "achwu khnai ha."},
    {"english": "my grandmother", "kaubru": "achui", "category": "family",
     "example_english": "My grandmother is kind.", "example_kaubru": "achui kaham ha."},
    {"english": "my uncle", "kaubru": "mama", "category": "family",
     "example_english": "My uncle came yesterday.", "example_kaubru": "mama mia phai ou."},
    {"english": "my aunt", "kaubru": "atoi", "category": "family",
     "example_english": "My aunt is here.", "example_kaubru": "atoi di tong ha."},
    {"english": "your father", "kaubru": "npha", "category": "family",
     "example_english": "Your father is big.", "example_kaubru": "npha ktor ha."},
    {"english": "your mother", "kaubru": "nma", "category": "family",
     "example_english": "Your mother came.", "example_kaubru": "nma phai ou."},
    {"english": "your elder brother", "kaubru": "nta", "category": "family",
     "example_english": "Your elder brother is here.", "example_kaubru": "nta di tong ha."},
    {"english": "your elder sister", "kaubru": "nbi", "category": "family",
     "example_english": "Your elder sister is kind.", "example_kaubru": "nbi kaham ha."},
    {"english": "his father", "kaubru": "mpha", "category": "family",
     "example_english": "His father is tall.", "example_kaubru": "mpha klao ha."},
    {"english": "his mother", "kaubru": "mma", "category": "family",
     "example_english": "His mother is here.", "example_kaubru": "mma di tong ha."},
    {"english": "his elder brother", "kaubru": "mta", "category": "family",
     "example_english": "His elder brother came.", "example_kaubru": "mta phai ou."},
    {"english": "his elder sister", "kaubru": "mbi", "category": "family",
     "example_english": "His elder sister is beautiful.", "example_kaubru": "mbi nythau ha."},

    # Verbs (expanded)
    {"english": "sleep", "kaubru": "thu di", "category": "verbs",
     "example_english": "I am sleeping.", "example_kaubru": "ang thu tong ha."},
    {"english": "wake up", "kaubru": "bacha di", "category": "verbs",
     "example_english": "Wake up early.", "example_kaubru": "phut khe bacha di."},
    {"english": "sit", "kaubru": "achou di", "category": "verbs",
     "example_english": "Please sit here.", "example_kaubru": "di achou di ro."},
    {"english": "run", "kaubru": "khai di", "category": "verbs",
     "example_english": "The child is running.", "example_kaubru": "chrai khai tong ha."},
    {"english": "give", "kaubru": "ri di", "category": "verbs",
     "example_english": "Give me water.", "example_kaubru": "ang no tui ri di."},
    {"english": "take", "kaubru": "la di", "category": "verbs",
     "example_english": "Take this.", "example_kaubru": "bo la di."},
    {"english": "buy", "kaubru": "pai di", "category": "verbs",
     "example_english": "I will buy rice.", "example_kaubru": "ang mairung pai nai."},
    {"english": "sell", "kaubru": "pha di", "category": "verbs",
     "example_english": "He sells fish.", "example_kaubru": "bung aah pha ou."},
    {"english": "open", "kaubru": "khulao di", "category": "verbs",
     "example_english": "Open the door.", "example_kaubru": "khulao di ro."},
    {"english": "close", "kaubru": "khlo di", "category": "verbs",
     "example_english": "Close the door.", "example_kaubru": "khlo di ro."},
    {"english": "write", "kaubru": "soi di", "category": "verbs",
     "example_english": "She is writing.", "example_kaubru": "bung soi tong ha."},
    {"english": "speak", "kaubru": "kau sa di", "category": "verbs",
     "example_english": "Speak slowly.", "example_kaubru": "kleh se kau sa di."},
    {"english": "listen", "kaubru": "khna di", "category": "verbs",
     "example_english": "Listen carefully.", "example_kaubru": "kaham se khna di."},
    {"english": "know", "kaubru": "cya ou", "category": "verbs",
     "example_english": "I know this.", "example_kaubru": "ang bo cya ou."},
    {"english": "think", "kaubru": "chong di", "category": "verbs",
     "example_english": "I am thinking.", "example_kaubru": "ang chong tong ha."},
    {"english": "want", "kaubru": "khatong mi", "category": "verbs",
     "example_english": "I want water.", "example_kaubru": "ang tui khatong mi."},
    {"english": "need", "kaubru": "nang mi", "category": "verbs",
     "example_english": "I need help.", "example_kaubru": "ang nangkhru nang mi."},
    {"english": "love", "kaubru": "maiya", "category": "verbs",
     "example_english": "I love my family.", "example_kaubru": "ang aini nouhkhung no maiya ou."},
    {"english": "help", "kaubru": "nangkhru di", "category": "verbs",
     "example_english": "Please help me.", "example_kaubru": "ang no nangkhru di ro."},
    {"english": "play", "kaubru": "thung di", "category": "verbs",
     "example_english": "Children are playing.", "example_kaubru": "chrai rao thung tong ha."},
    {"english": "sing", "kaubru": "rcha di", "category": "verbs",
     "example_english": "She sings well.", "example_kaubru": "bung kaham se rcha ou."},
    {"english": "dance", "kaubru": "msa di", "category": "verbs",
     "example_english": "They are dancing.", "example_kaubru": "brao msa tong ha."},
    {"english": "laugh", "kaubru": "mnui", "category": "verbs",
     "example_english": "He is laughing.", "example_kaubru": "bung mnui tong ha."},
    {"english": "cry", "kaubru": "kah", "category": "verbs",
     "example_english": "The child is crying.", "example_kaubru": "chrai kah tong ha."},
    {"english": "call", "kaubru": "ring di", "category": "verbs",
     "example_english": "Call me tomorrow.", "example_kaubru": "khnai ang no ring di."},
    {"english": "wait", "kaubru": "nysing di", "category": "verbs",
     "example_english": "Wait here.", "example_kaubru": "di nysing di ro."},
    {"english": "return", "kaubru": "pheraoh ha", "category": "verbs",
     "example_english": "He returned home.", "example_kaubru": "bung nouh pheraoh ha."},
    {"english": "bring", "kaubru": "tuibi di", "category": "verbs",
     "example_english": "Bring water.", "example_kaubru": "tui tuibi di ro."},
    {"english": "carry", "kaubru": "khosa di", "category": "verbs",
     "example_english": "She is carrying a bag.", "example_kaubru": "bung khosa tong ha."},
    {"english": "wash", "kaubru": "su di", "category": "verbs",
     "example_english": "Wash your hands.", "example_kaubru": "nini khu su di ro."},

    # Verbs (confirmed from grammar book examples)
    {"english": "go", "kaubru": "thanng", "category": "verbs",
     "example_english": "I shall go home tomorrow.", "example_kaubru": "khnai ang nouh wo thanng nai."},
    {"english": "come", "kaubru": "phai", "category": "verbs",
     "example_english": "You come daily.", "example_kaubru": "nung khe salboi se phai ou."},
    {"english": "eat", "kaubru": "cha", "category": "verbs",
     "example_english": "We have eaten food.", "example_kaubru": "chung mai cha ha."},
    {"english": "stand", "kaubru": "bahcha", "category": "verbs",
     "example_english": "He is standing.", "example_kaubru": "bung bahcha tong ou."},
    {"english": "hide", "kaubru": "chom", "category": "verbs",
     "example_english": "She will hide.", "example_kaubru": "bung chom nai."},
    {"english": "plant", "kaubru": "kai", "category": "verbs",
     "example_english": "They have planted rice.", "example_kaubru": "brao mairung kai ha."},
    {"english": "sow", "kaubru": "kai", "category": "verbs",
     "example_english": "He will sow seeds.", "example_kaubru": "bung kai nai."},
    {"english": "throw", "kaubru": "khui", "category": "verbs",
     "example_english": "I threw it away.", "example_kaubru": "ang khui ha."},
    {"english": "burn", "kaubru": "sau", "category": "verbs",
     "example_english": "The fire is burning.", "example_kaubru": "hor sau tong ou."},
    {"english": "do", "kaubru": "tang", "category": "verbs",
     "example_english": "I am doing work.", "example_kaubru": "ang samung tang tong ou."},
    {"english": "work", "kaubru": "tang", "category": "verbs",
     "example_english": "He is working.", "example_kaubru": "bung samung tang tong ou."},
    {"english": "say", "kaubru": "sa", "category": "verbs",
     "example_english": "She says.", "example_kaubru": "bung sa ou."},
    {"english": "walk", "kaubru": "hinng", "category": "verbs",
     "example_english": "I am walking on the road.", "example_kaubru": "ang lama se hinng tong ha."},
    {"english": "read", "kaubru": "pore", "category": "verbs",
     "example_english": "She is reading a book.", "example_kaubru": "bung boi pore tong ha."},
    {"english": "look for", "kaubru": "tau", "category": "verbs",
     "example_english": "He was looking for a chicken.", "example_kaubru": "bung phuh wo tau nai tong ou."},
    {"english": "see", "kaubru": "nai", "category": "verbs",
     "example_english": "I see you.", "example_kaubru": "ang nung no nai ou."},

    # Common phrases (expanded)
    {"english": "how much does this cost?", "kaubru": "bo msha ha phi?", "category": "phrases",
     "example_english": "How much does this cost?", "example_kaubru": "bo msha ha phi?"},
    {"english": "i don't understand", "kaubru": "mchi ya lei", "category": "phrases",
     "example_english": "I don't understand.", "example_kaubru": "mchi ya lei."},
    {"english": "i am hungry", "kaubru": "ang mai hokhoi ha lei", "category": "phrases",
     "example_english": "I am hungry.", "example_kaubru": "ang mai hokhoi ha lei."},
    {"english": "i am thirsty", "kaubru": "toi kang ha lei", "category": "phrases",
     "example_english": "I am thirsty.", "example_kaubru": "toi kang ha lei."},
    {"english": "good morning", "kaubru": "phuaing kaham", "category": "phrases",
     "example_english": "Good morning!", "example_kaubru": "phuaing kaham!"},
    {"english": "good night", "kaubru": "hor kaham", "category": "phrases",
     "example_english": "Good night!", "example_kaubru": "hor kaham!"},
    {"english": "good evening", "kaubru": "saroi kaham", "category": "phrases",
     "example_english": "Good evening!", "example_kaubru": "saroi kaham!"},
    {"english": "good afternoon", "kaubru": "saja kaham", "category": "phrases",
     "example_english": "Good afternoon!", "example_kaubru": "saja kaham!"},
    {"english": "i am fine", "kaubru": "kaham no ang", "category": "phrases",
     "example_english": "I am fine, thank you.", "example_kaubru": "kaham no ang, khachang ha."},
    {"english": "what time is it?", "kaubru": "somoing msa ha ong thang halahel", "category": "phrases",
     "example_english": "What time is it?", "example_kaubru": "somoing msa ha ong thang halahel?"},
    {"english": "help me", "kaubru": "ang no nangkhru ga di", "category": "phrases",
     "example_english": "Please help me.", "example_kaubru": "ang no nangkhru ga di."},
    {"english": "i am lost", "kaubru": "ang kma mi", "category": "phrases",
     "example_english": "I am lost.", "example_kaubru": "ang kma mi."},
    {"english": "where is the toilet?", "kaubru": "khithai mtoi ou phi", "category": "phrases",
     "example_english": "Where is the toilet?", "example_kaubru": "khithai mtoi ou phi?"},
    {"english": "how far is it?", "kaubru": "tre msaha hachal mi?", "category": "phrases",
     "example_english": "How far is it?", "example_kaubru": "tre msaha hachal mi?"},
    {"english": "turn left", "kaubru": "yakchi kho nyhoi di", "category": "phrases",
     "example_english": "Turn left here.", "example_kaubru": "yakchi kho nyhoi di."},
    {"english": "turn right", "kaubru": "yakgra kho nyhoi di", "category": "phrases",
     "example_english": "Turn right here.", "example_kaubru": "yakgra kho nyhoi di."},
    {"english": "wait a moment", "kaubru": "sa nysing gra di", "category": "phrases",
     "example_english": "Wait a moment please.", "example_kaubru": "sa nysing gra di."},
    {"english": "i am from", "kaubru": "ang le ... ni sei", "category": "phrases",
     "example_english": "I am from Tripura.", "example_kaubru": "ang le Tripura ni sei."},
    {"english": "nice to meet you", "kaubru": "nung by malai mo khachang ha", "category": "phrases",
     "example_english": "Nice to meet you.", "example_kaubru": "nung by malai mo khachang ha."},
    {"english": "congratulations", "kaubru": "khachang khru", "category": "phrases",
     "example_english": "Congratulations!", "example_kaubru": "khachang khru!"},
    {"english": "happy birthday", "kaubru": "achaimo sal kaham", "category": "phrases",
     "example_english": "Happy birthday!", "example_kaubru": "achaimo sal kaham!"},
    {"english": "get well soon", "kaubru": "dai ham di", "category": "phrases",
     "example_english": "Get well soon.", "example_kaubru": "dai ham di."},


    # Question sentences
    {"english": "where do you live?", "kaubru": "nung mtoi ou tong mi?", "category": "phrases",
     "example_english": "Where do you live?", "example_kaubru": "nung mtoi ou tong mi?"},
    {"english": "how old are you?", "kaubru": "msaha bosi ka thang hala", "category": "phrases",
     "example_english": "How old are you?", "example_kaubru": "msaha bosi ka thang hala?"},
    {"english": "what are you doing?", "kaubru": "ma khe tong mi?", "category": "phrases",
     "example_english": "What are you doing?", "example_kaubru": "ma khe tong mi?"},
    {"english": "do you speak kaubru?", "kaubru": "kaubru sa mai ou dei?", "category": "phrases",
     "example_english": "Do you speak KauBru?", "example_kaubru": "kaubru sa mai ou dei?"},
    {"english": "can you help me?", "kaubru": "nung angno nangkhru mai ny de?", "category": "phrases",
     "example_english": "Can you help me?", "example_kaubru": "nung angno nangkhru mai ny de?"},
    {"english": "which village are you from?", "kaubru": "mtoi para ni phi nung?", "category": "phrases",
     "example_english": "Which village are you from?", "example_kaubru": "mtoi para ni phi nung?"},

    # Description sentences
    {"english": "the mountain is very tall", "kaubru": "bo hahphung le betha kchu ha", "category": "places",
     "example_english": "The mountain is very tall.", "example_kaubru": "bo hahphung le betha kchu ha."},
    {"english": "the river is cold and clean", "kaubru": "bo tuisa le betha kchang ou mkhe poriskar sei", "category": "nature",
     "example_english": "The river is cold and clean.", "example_kaubru": "bo tuisa le betha kchang ou mkhe poriskar sei."},

    # Time words (expanded)
    {"english": "morning", "kaubru": "phuaing", "category": "time",
     "example_english": "Good morning!", "example_kaubru": "phuaing kaham!"},
    {"english": "afternoon", "kaubru": "saja", "category": "time",
     "example_english": "Good afternoon!", "example_kaubru": "saja kaham!"},
    {"english": "evening", "kaubru": "saroi", "category": "time",
     "example_english": "Good evening!", "example_kaubru": "saroi kaham!"},
    {"english": "night", "kaubru": "hor", "category": "time",
     "example_english": "Good night!", "example_kaubru": "hor kaham!"},
    {"english": "hour", "kaubru": "gonta ha", "category": "time",
     "example_english": "Wait one hour.", "example_kaubru": "gonta ha nysing di."},
    {"english": "minute", "kaubru": "minit", "category": "time",
     "example_english": "Wait a minute.", "example_kaubru": "minit ha nysing di."},
    {"english": "early", "kaubru": "do ha", "category": "time",
     "example_english": "Come early.", "example_kaubru": "do ha phai di."},
    {"english": "late", "kaubru": "somoing lai ha", "category": "time",
     "example_english": "He came late.", "example_kaubru": "bung somoing lai ha phai ou."},
    {"english": "before", "kaubru": "skang", "category": "time",
     "example_english": "Come before noon.", "example_kaubru": "saja skang phai di."},
    {"english": "after", "kaubru": "apai ye", "category": "time",
     "example_english": "Come after eating.", "example_kaubru": "mai cha apai ye phai di."},
    {"english": "soon", "kaubru": "phut", "category": "time",
     "example_english": "Come soon.", "example_kaubru": "phut khe phai di."},
    {"english": "long ago", "kaubru": "ake phut", "category": "time",
     "example_english": "This happened long ago.", "example_kaubru": "bo ake phut tong ha."},
    {"english": "last year", "kaubru": "semai", "category": "time",
     "example_english": "Last year was good.", "example_kaubru": "semai borsa kaham ha."},
    {"english": "next year", "kaubru": "khali", "category": "time",
     "example_english": "Next year we will go.", "example_kaubru": "khali chung thang nai."},

    # Common phrases
    {"english": "i am going home", "kaubru": "ang nouh thang ganu", "category": "phrases",
     "example_english": "I am going home now.", "example_kaubru": "taoh ou nouh thang gra nu ."},
    {"english": "i love you", "kaubru": "ang nung no maiya ong ou", "category": "phrases",
     "example_english": "I love you, mother.", "example_kaubru": "among nung no maiya ong ou ang."},
    {"english": "where are you going", "kaubru": "mtoi ou thang ny nung ba?", "category": "phrases",
     "example_english": "Where are you going?", "example_kaubru": "Mtoi ou thang ny nung ba?"},
    {"english": "come here", "kaubru": "phai di ro", "category": "phrases",
     "example_english": "Come here quickly.", "example_kaubru": "phut khe phai di ro ou."},
    {"english": "eat food", "kaubru": "mai cha di", "category": "phrases",
     "example_english": "Let us eat food.", "example_kaubru": "Mai cha lai na."},

    # Food (expanded)
    {"english": "food", "kaubru": "mai", "category": "food",
     "example_english": "The food is ready.", "example_kaubru": "mai kaham ha."},
    {"english": "water", "kaubru": "tui", "category": "food",
     "example_english": "I drink water.", "example_kaubru": "ang tui nong ou."},
    {"english": "meat", "kaubru": "mangso", "category": "food",
     "example_english": "We are eating meat.", "example_kaubru": "chung mangso cha tong ha."},
    {"english": "fish", "kaubru": "aah", "category": "food",
     "example_english": "The fish is fresh.", "example_kaubru": "aah kaham ha."},
    {"english": "vegetable", "kaubru": "moi-mblai", "category": "food",
     "example_english": "Vegetables are healthy.", "example_kaubru": "moi-mblai kaham ha."},
    {"english": "fruit", "kaubru": "mphang mthai", "category": "food",
     "example_english": "The fruit is sweet.", "example_kaubru": "mphang mthai ktui ha."},
    {"english": "egg", "kaubru": "taotoi", "category": "food",
     "example_english": "I eat an egg every morning.", "example_kaubru": "ang taotoi salboi cha ou."},
    {"english": "milk", "kaubru": "duh", "category": "food",
     "example_english": "The child drinks milk.", "example_kaubru": "chrai duh nong ou."},
    {"english": "bread", "kaubru": "awaing", "category": "food",
     "example_english": "I eat bread in the morning.", "example_kaubru": "ang awaing cha ou."},
    {"english": "salt", "kaubru": "som", "category": "food",
     "example_english": "Add salt to the food.", "example_kaubru": "mai se som dalaomo ro."},
    {"english": "oil", "kaubru": "thao", "category": "food",
     "example_english": "Cook with oil.", "example_kaubru": "thao se sung ro."},
    {"english": "banana", "kaubru": "thai-lit", "category": "food",
     "example_english": "The banana is yellow.", "example_kaubru": "thai-lit kormo ha."},
    {"english": "mango", "kaubru": "thaichuchu", "category": "food",
     "example_english": "The mango is sweet.", "example_kaubru": "thaichuchu ktui ha."},
    {"english": "chicken", "kaubru": "taohaing", "category": "food",
     "example_english": "We cooked chicken today.", "example_kaubru": "chung tini taohaing sung ha."},
    {"english": "cook", "kaubru": "sung", "category": "food",
     "example_english": "My mother is cooking.", "example_kaubru": "aini mma sung tong ha."},
    {"english": "drink", "kaubru": "nong", "category": "food",
     "example_english": "Drink water.", "example_kaubru": "tui nong ro."},
    {"english": "hungry", "kaubru": "hokhoi", "category": "food",
     "example_english": "I am hungry.", "example_kaubru": "ang hokhoi tong ha."},
    {"english": "thirsty", "kaubru": "toi kangha", "category": "food",
     "example_english": "I am thirsty.", "example_kaubru": "ang toi kangha tong ha."},

    # Places
    {"english": "village", "kaubru": "para ste", "category": "places",
     "example_english": "I live in a village.", "example_kaubru": "ang para ste se tong ha."},
    {"english": "market", "kaubru": "bazaar", "category": "places",
     "example_english": "We are going to the market.", "example_kaubru": "chung bazaar thang gra nu."},
    {"english": "school", "kaubru": "iskul", "category": "places",
     "example_english": "The child goes to school.", "example_kaubru": "chrai iskul thang ou."},
    {"english": "road", "kaubru": "lama", "category": "places",
     "example_english": "I am walking on the road.", "example_kaubru": "ang lama se hinng tong ha."},
    {"english": "forest", "kaubru": "blong", "category": "places",
     "example_english": "The forest is green.", "example_kaubru": "blong samkhrang ha."},
    {"english": "mountain", "kaubru": "hahphung", "category": "places",
     "example_english": "The mountain is very tall.", "example_kaubru": "hahphung betha khe klao ha."},
    {"english": "hill", "kaubru": "hathai", "category": "places",
     "example_english": "We live on the hill.", "example_kaubru": "chung hathai se tong ha."},
    {"english": "temple", "kaubru": "mondri", "category": "places",
     "example_english": "The temple is near the village.", "example_kaubru": "mondri para ste phui tong ha."},
    {"english": "hospital", "kaubru": "hospital", "category": "places",
     "example_english": "He went to the hospital.", "example_kaubru": "bung hospital thang ha."},
    {"english": "shop", "kaubru": "dukan", "category": "places",
     "example_english": "I am going to the shop.", "example_kaubru": "ang dukan thang gra nu."},

    # Tastes (Tharmung)
    {"english": "sweet", "kaubru": "ktui", "category": "taste",
     "example_english": "This fruit is sweet.", "example_kaubru": "bo thaiha le ktui ha."},
    {"english": "bitter", "kaubru": "kuk'kha", "category": "taste",
     "example_english": "This medicine is bitter.", "example_kaubru": "bo dawai le kuk'kha ha."},
    {"english": "sour", "kaubru": "kuk'khoi", "category": "taste",
     "example_english": "The lemon is sour.", "example_kaubru": "bo le kuk'khoi ha."},
    {"english": "salty", "kaubru": "kplah", "category": "taste",
     "example_english": "The food is salty.", "example_kaubru": "mai le kplah ha."},
    {"english": "pungent", "kaubru": "hiyao", "category": "taste",
     "example_english": "The onion is pungent.", "example_kaubru": "bo le hiyao ha."},
    {"english": "astringent", "kaubru": "mcher", "category": "taste",
     "example_english": "This taste is astringent.", "example_kaubru": "bo tharmung le mcher ha."},
    {"english": "hot", "kaubru": "ktung", "category": "taste",
     "example_english": "The chilli is hot.", "example_kaubru": "bo le ktung ha."},
    {"english": "cold", "kaubru": "kchang", "category": "taste",
     "example_english": "The water is cold.", "example_kaubru": "tui le kchang ha."},
    {"english": "taste", "kaubru": "tharmung", "category": "taste",
     "example_english": "What is the taste?", "example_kaubru": "tharmung kma ba?"},

    # Senses (Tharphang)
    {"english": "eye", "kaubru": "mkoih", "category": "senses",
     "example_english": "My eyes are big.", "example_kaubru": "aini mkoih ktor ha."},
    {"english": "ear", "kaubru": "khunju", "category": "senses",
     "example_english": "My ear hurts.", "example_kaubru": "aini khunju kham tong ha."},
    {"english": "nose", "kaubru": "kongthai", "category": "senses",
     "example_english": "The nose smells flowers.", "example_kaubru": "kongthai le phuih nai ou."},
    {"english": "tongue", "kaubru": "slai", "category": "senses",
     "example_english": "The tongue tastes food.", "example_kaubru": "slai le mai tharmung nai ou."},
    {"english": "skin", "kaubru": "bukur", "category": "senses",
     "example_english": "The skin is soft.", "example_kaubru": "bukur le kaham ha."},
    {"english": "senses", "kaubru": "tharphang", "category": "senses",
     "example_english": "We have five senses.", "example_kaubru": "chini tharphang ba tong ha."},

    # Colours (Rong)
    {"english": "white", "kaubru": "kphuih", "category": "colours",
     "example_english": "The flower is white.", "example_kaubru": "phuih le kphuih ha."},
    {"english": "black", "kaubru": "ksom", "category": "colours",
     "example_english": "The night is black.", "example_kaubru": "ksom tong ha."},
    {"english": "yellow", "kaubru": "kormo", "category": "colours",
     "example_english": "The sun is yellow.", "example_kaubru": "sal le kormo ha."},
    {"english": "green", "kaubru": "samkhrang", "category": "colours",
     "example_english": "The tree is green.", "example_kaubru": "mphang le samkhrang ha."},
    {"english": "blue", "kaubru": "somkhrang", "category": "colours",
     "example_english": "The sky is blue.", "example_kaubru": "akash le somkhrang ha."},
    {"english": "violet", "kaubru": "phanthaoba", "category": "colours",
     "example_english": "The flower is violet.", "example_kaubru": "phuih le phanthaoba ha."},
    {"english": "orange", "kaubru": "komlaku", "category": "colours",
     "example_english": "The fruit is orange.", "example_kaubru": "thaiha le komlaku ha."},
    {"english": "colour", "kaubru": "rong", "category": "colours",
     "example_english": "What colour is this?", "example_kaubru": "bo rong kma ba?"},

    # Seasons (Jwomari)
    {"english": "summer", "kaubru": "satungbla", "category": "seasons",
     "example_english": "Summer is hot.", "example_kaubru": "satungbla le ktung ha."},
    {"english": "rainy season", "kaubru": "barsa", "category": "seasons",
     "example_english": "The rainy season brings water.", "example_kaubru": "barsa le tui phai tong ha."},
    {"english": "autumn", "kaubru": "kchangsohma", "category": "seasons",
     "example_english": "Autumn leaves fall.", "example_kaubru": "kchangsohma le mphang slai thang tong ha."},
    {"english": "winter", "kaubru": "masing", "category": "seasons",
     "example_english": "Winter is cold.", "example_kaubru": "masing le kchang ha."},
    {"english": "spring", "kaubru": "tungsohma", "category": "seasons",
     "example_english": "Spring is beautiful.", "example_kaubru": "tungsohma le nythau ha."},
    {"english": "climate", "kaubru": "salhom", "category": "seasons",
     "example_english": "The climate is good here.", "example_kaubru": "di salhom kaham ha."},
    {"english": "weather", "kaubru": "bahom", "category": "seasons",
     "example_english": "The weather is cold today.", "example_kaubru": "tini bahom kchang ha."},
    {"english": "season", "kaubru": "jwomari", "category": "seasons",
     "example_english": "Which season is this?", "example_kaubru": "bo jwomari kma ba?"},
]

# --- Lessons ------------------------------------------------------------------

LESSONS = [
    {
        "title": "Common Greetings",
        "description": "Learn everyday greetings in KauBru language.",
        "category": "greetings",
        "progress": 0.0,
        "is_premium": False,
    },
    {
        "title": "Family Words",
        "description": "Names for family members in KauBru.",
        "category": "family",
        "progress": 0.0,
        "is_premium": False,
    },
    {
        "title": "Numbers 1-10",
        "description": "Count from one to ten in KauBru.",
        "category": "numbers",
        "progress": 0.0,
        "is_premium": False,
    },
    {
        "title": "Daily Conversations",
        "description": "Useful phrases for everyday conversations.",
        "category": "phrases",
        "progress": 0.0,
        "is_premium": False,
    },
    {
        "title": "Folk Stories",
        "description": "Traditional KauBru folk stories with vocabulary.",
        "category": "culture",
        "progress": 0.0,
        "is_premium": True,
    },
    {
        "title": "Pronunciation Practice",
        "description": "Master the sounds and tones of KauBru.",
        "category": "pronunciation",
        "progress": 0.0,
        "is_premium": True,
    },
]

# --- Culture Articles ---------------------------------------------------------

CULTURE_ARTICLES = [
    # -- History --------------------------------------------------------------
    {
        "title": "Origins of the KauBru People",
        "category": "history",
        "summary": (
            "The KauBru, also known as the Bru or Reang, are one of the oldest indigenous "
            "communities of Northeast India, with roots stretching back thousands of years across "
            "the hills of Tripura, Mizoram, and Assam. Their oral traditions, migration legends, "
            "and material culture reveal a rich and resilient civilisation shaped by the forests "
            "and rivers of the region."
        ),
        "content": (
            "The KauBru people - known variously as Bru, Reang, or Vru - are among the earliest "
            "inhabitants of the hill tracts of present-day Tripura, Mizoram, and parts of Assam "
            "and Manipur. Linguistic and anthropological evidence places their proto-community in "
            "the broader Tibeto-Burman language family, suggesting ancient migrations from the "
            "eastern Himalayan foothills into the lush river valleys of Northeast India.\n\n"
            "According to oral tradition, the KauBru trace their ancestry to a mythical progenitor "
            "named 'Bru-fa', meaning 'the first Bru'. Their creation narratives describe a world "
            "formed from the union of sky and earth, with the first people emerging from a sacred "
            "bamboo grove. These stories are not merely legend - they encode ecological knowledge, "
            "social norms, and a deep spiritual relationship with the natural world that continues "
            "to shape KauBru identity today.\n\n"
            "Historically, the KauBru practised shifting cultivation (jhum) in the forested hills, "
            "moving their settlements in cycles that allowed the land to regenerate. This intimate "
            "knowledge of forest ecology - which plants heal, which soils yield, which seasons "
            "bring rain - was passed down through generations in song, story, and ritual. The "
            "community was organised into clans (called 'nouhkhung' in KauBru), each with its own "
            "hereditary chief and ceremonial responsibilities.\n\n"
            "The arrival of the Manikya kings of Tripura brought the KauBru into contact with "
            "lowland Hindu culture, leading to a gradual cultural exchange that enriched both "
            "communities. KauBru artisans became renowned for their handloom weaving, and their "
            "distinctive textiles - featuring geometric patterns in deep reds, blacks, and whites "
            "- became prized trade goods. Despite centuries of political change, the KauBru have "
            "maintained a strong sense of cultural continuity, preserving their language, rituals, "
            "and performing arts as living expressions of their ancient heritage."
        ),
        "tags": "history,origins,Tripura,Bru,Reang,migration,oral tradition",
        "read_time_minutes": 5,
        "is_published": True,
    },

    # -- Dance -----------------------------------------------------------------
    {
        "title": "The Hojagiri Dance",
        "category": "dance",
        "summary": (
            "Hojagiri is the most celebrated performing art of the KauBru/Reang people, "
            "recognised by UNESCO as an Intangible Cultural Heritage of Humanity. Performed "
            "primarily by young women during the Kojagiri full-moon festival, it is a breathtaking "
            "display of balance, grace, and rhythmic precision that embodies the community's "
            "spiritual connection to the harvest season."
        ),
        "content": (
            "Hojagiri - derived from 'Hoja' (the name of the presiding deity) and 'giri' (dance) "
            "- is the signature performing art of the KauBru/Reang people of Tripura and Mizoram. "
            "It is performed during the Kojagiri Purnima (full-moon night in the month of Ashwin, "
            "roughly October), a festival dedicated to Lakshmi, the goddess of prosperity, and to "
            "the KauBru deity Hoja who is believed to bless the harvest.\n\n"
            "What makes Hojagiri extraordinary is its technical demand. Performers - traditionally "
            "unmarried young women - balance earthen pots on their heads while standing on the "
            "narrow neck of a clay pitcher placed on the ground. They execute intricate footwork, "
            "graceful arm movements, and expressive facial gestures, all while maintaining perfect "
            "equilibrium. Some performers add further difficulty by holding a lit lamp or a bottle "
            "in each hand, or by balancing multiple pots simultaneously.\n\n"
            "The dance is accompanied by the 'khamb' (a long cylindrical drum), the 'sarinda' "
            "(a bowed string instrument), and the 'chongpreng' (a bamboo mouth harp). Singers "
            "perform traditional Hojagiri songs that praise the goddess, celebrate the harvest, "
            "and recount the community's history. The costumes are equally striking: performers "
            "wear the traditional 'risa' (a handwoven cloth draped around the body), adorned with "
            "silver jewellery, floral headpieces, and intricate beadwork.\n\n"
            "In 2013, Hojagiri was inscribed on UNESCO's Representative List of the Intangible "
            "Cultural Heritage of Humanity, bringing international recognition to this ancient art "
            "form. Today, Hojagiri troupes perform at national cultural festivals, state functions, "
            "and international events, serving as living ambassadors of KauBru heritage. Efforts "
            "by cultural organisations and the Tripura government to document and teach Hojagiri "
            "to younger generations ensure that this remarkable tradition continues to thrive."
        ),
        "tags": "Hojagiri,dance,UNESCO,Kojagiri,festival,Reang,Tripura,performing arts",
        "read_time_minutes": 5,
        "is_published": True,
    },

    # -- Music -----------------------------------------------------------------
    {
        "title": "Musical Instruments of the KauBru",
        "category": "music",
        "summary": (
            "The KauBru musical tradition is built around a rich ensemble of handcrafted instruments "
            "- drums, string instruments, and wind instruments fashioned from bamboo, animal hide, "
            "and wood. Each instrument carries ceremonial significance and is associated with "
            "specific rituals, seasons, and social occasions."
        ),
        "content": (
            "Music is inseparable from KauBru life. From birth ceremonies to harvest festivals, "
            "from healing rituals to wedding celebrations, every significant moment in the community "
            "is marked by song and instrumental performance. The KauBru musical tradition is "
            "primarily oral - compositions are memorised and transmitted through practice rather "
            "than written notation - which gives the music a living, evolving quality.\n\n"
            "The most important percussion instrument is the 'khamb', a long cylindrical drum "
            "carved from a single log and covered with animal hide at both ends. The khamb provides "
            "the rhythmic foundation for Hojagiri and other ceremonial dances. Its deep, resonant "
            "beats can be heard across great distances, traditionally serving as a community "
            "signal as well as a musical instrument. Skilled khamb players are highly respected "
            "within the community.\n\n"
            "The 'sarinda' is a bowed string instrument with a distinctive boat-shaped resonating "
            "chamber carved from wood and covered with animal skin. It produces a haunting, "
            "expressive tone that is central to KauBru folk songs and narrative ballads. The "
            "'chongpreng' (also called 'tumpreng') is a bamboo mouth harp - a small, delicate "
            "instrument that creates a buzzing, melodic sound when the player plucks a thin "
            "bamboo tongue while holding the instrument to their lips. It is often played by "
            "young people during courtship.\n\n"
            "Wind instruments include the 'lebang' (a bamboo flute) and various types of "
            "ceremonial horns used during religious festivals. The KauBru also have a tradition "
            "of vocal music - particularly group singing during agricultural work, where call-and-"
            "response songs help coordinate labour and maintain community spirit. These work songs, "
            "known as 'khulung', are among the oldest surviving forms of KauBru musical expression."
        ),
        "tags": "music,khamb,sarinda,chongpreng,instruments,bamboo,folk music",
        "read_time_minutes": 4,
        "is_published": True,
    },

    # -- Traditions ------------------------------------------------------------
    {
        "title": "Handloom Weaving: The Living Textile Tradition",
        "category": "traditions",
        "summary": (
            "Handloom weaving is one of the most cherished traditions of KauBru women, producing "
            "distinctive textiles characterised by bold geometric patterns in deep reds, blacks, "
            "and whites. Each cloth tells a story - of clan identity, ceremonial purpose, and the "
            "weaver's own artistic vision - making KauBru textiles among the most expressive "
            "material culture objects in Northeast India."
        ),
        "content": (
            "Among the KauBru people, the ability to weave is considered an essential skill for "
            "women, passed from mother to daughter beginning in childhood. The traditional backstrap "
            "loom - a simple but ingenious device that uses the weaver's own body weight as tension "
            "- is the primary tool, and mastery of it is a mark of cultural competence and "
            "feminine identity.\n\n"
            "KauBru textiles are immediately recognisable by their bold geometric motifs: diamond "
            "shapes, zigzag borders, and stylised representations of animals and natural forms "
            "woven in deep crimson, black, and white cotton threads. The most important garment "
            "is the 'risa', a multipurpose cloth worn by women as a wrap skirt, shawl, or head "
            "covering. The 'risa' worn during Hojagiri performances is especially elaborate, "
            "featuring the finest weaving and the most intricate patterns.\n\n"
            "Different clans and sub-groups within the KauBru community have their own distinctive "
            "weaving patterns, allowing knowledgeable observers to identify a weaver's origin from "
            "the cloth alone. Certain patterns are reserved for ceremonial use - worn only during "
            "festivals, rites of passage, or when meeting important guests. The knowledge of which "
            "patterns are appropriate for which occasions is itself a form of cultural literacy.\n\n"
            "In recent decades, KauBru weavers have gained recognition beyond their communities. "
            "Government craft boards and NGOs have helped connect artisans with urban markets, "
            "and KauBru textiles are now sold in craft fairs and online platforms. While "
            "commercialisation brings economic opportunity, community elders emphasise the "
            "importance of preserving the ceremonial and symbolic dimensions of weaving - ensuring "
            "that the cloth remains a living cultural practice, not merely a commodity."
        ),
        "tags": "weaving,textiles,risa,handloom,traditions,women,craft,Tripura",
        "read_time_minutes": 4,
        "is_published": True,
    },

    # -- Language --------------------------------------------------------------
    {
        "title": "The KauBru Language: Structure, Script, and Survival",
        "category": "language",
        "summary": (
            "KauBru (also called Bru or Reang) is a Tibeto-Burman language spoken by approximately "
            "500,000 people across Tripura, Mizoram, and Assam. Despite lacking an official script "
            "for most of its history, the language has survived through a rich oral tradition, and "
            "recent decades have seen significant efforts to standardise its writing system and "
            "introduce it into formal education."
        ),
        "content": (
            "KauBru belongs to the Tibeto-Burman branch of the Sino-Tibetan language family, "
            "making it a distant relative of languages such as Tibetan, Burmese, and Manipuri. "
            "Within the Tibeto-Burman group, it is most closely related to the Kokborok language "
            "of the Tripuri people, reflecting centuries of geographic proximity and cultural "
            "exchange. The language is tonal - meaning that the pitch at which a syllable is "
            "spoken can change its meaning - a feature shared with many other Tibeto-Burman "
            "languages.\n\n"
            "Historically, KauBru was an exclusively oral language. The community's vast store of "
            "knowledge - agricultural techniques, medicinal plant lore, genealogies, ritual "
            "procedures, folk narratives - was preserved entirely through memory and oral "
            "transmission. This placed enormous cultural importance on skilled speakers, storytellers, "
            "and ritual specialists who served as living libraries of community knowledge.\n\n"
            "The development of a written script for KauBru is a relatively recent phenomenon. "
            "Various scripts have been proposed and used over the decades, including adaptations "
            "of the Bengali script (widely used in Tripura) and the Roman script (used in Mizoram). "
            "In 2004, the Tripura government officially recognised KauBru as a scheduled language, "
            "and efforts to introduce it into primary school curricula have since gained momentum. "
            "The KauBru language app itself is part of this broader movement to create digital "
            "resources that make the language accessible to younger generations.\n\n"
            "Linguists have documented several dialects of KauBru, with notable differences in "
            "vocabulary and pronunciation between communities in Tripura and those in Mizoram. "
            "Despite these variations, speakers from different regions can generally understand "
            "one another, and there is a strong sense of shared linguistic identity across the "
            "KauBru diaspora. Language preservation efforts - including this app, community radio "
            "programmes, and cultural festivals - are helping to ensure that KauBru remains a "
            "vibrant, living language for generations to come."
        ),
        "tags": "language,Tibeto-Burman,script,oral tradition,linguistics,preservation,education",
        "read_time_minutes": 5,
        "is_published": True,
    },

    # -- Festivals -------------------------------------------------------------
    {
        "title": "Buisu: The KauBru New Year Festival",
        "category": "festivals",
        "summary": (
            "Buisu is the most important festival of the KauBru calendar, celebrated in mid-April "
            "to mark the new year and the beginning of the agricultural cycle. It is a time of "
            "communal feasting, ritual purification, ancestral veneration, and joyful celebration "
            "that brings together families and clans across the region."
        ),
        "content": (
            "Buisu - sometimes spelled 'Bisu' or 'Bishu' - is the KauBru new year festival, "
            "celebrated around the 14th of April each year, coinciding with the Bengali new year "
            "(Pohela Boishakh) and similar spring festivals across South and Southeast Asia. The "
            "name is believed to derive from the Sanskrit 'Vishuvat', meaning equinox, reflecting "
            "the festival's deep roots in the agricultural calendar.\n\n"
            "The festival typically lasts three days. The first day, called 'Hari Buisu', is "
            "dedicated to the animals - cattle and other livestock are bathed, decorated with "
            "flowers, and given special food as a gesture of gratitude for their labour throughout "
            "the year. The second day, 'Manuh Buisu', is the main celebration for people: families "
            "gather, new clothes are worn, traditional foods are prepared, and the community comes "
            "together for singing, dancing, and feasting. The third day, 'Gos Buisu', is dedicated "
            "to trees and plants - a reflection of the KauBru's deep ecological consciousness and "
            "their understanding of the interdependence between human communities and the natural "
            "world.\n\n"
            "Central to Buisu celebrations is the preparation of traditional foods, particularly "
            "rice-based dishes and fermented beverages. 'Mairung' (rice) is the foundation of the "
            "festival meal, prepared in various forms including steamed rice cakes wrapped in "
            "banana leaves. The communal meal is preceded by offerings to ancestral spirits and "
            "the household deity, ensuring that the new year begins with spiritual blessings.\n\n"
            "Buisu is also the occasion for the most elaborate performances of Hojagiri and other "
            "traditional dances. Young people dress in their finest traditional attire, and "
            "competitions between villages add a festive, celebratory energy to the proceedings. "
            "In recent years, state-level Buisu celebrations have been organised in Agartala and "
            "other cities, bringing KauBru culture to wider audiences and strengthening community "
            "pride among those living far from their ancestral villages."
        ),
        "tags": "Buisu,festival,new year,agriculture,celebration,Tripura,Reang,spring",
        "read_time_minutes": 5,
        "is_published": True,
    },
]

# --- Demo User ----------------------------------------------------------------

def seed():
    # Words - upsert by (english, category) so new words are always added
    existing_keys = {
        (w.english.lower().strip(), w.category.lower().strip())
        for w in db.query(models.Word).all()
    }
    added = 0
    for w in WORDS:
        key = (w["english"].lower().strip(), w["category"].lower().strip())
        if key not in existing_keys:
            db.add(models.Word(**w))
            existing_keys.add(key)
            added += 1
    if added:
        print(f"[OK] Added {added} new words (total: {len(existing_keys)}).")
    else:
        print(f"[SKIP] All {len(existing_keys)} words already in DB.")

    # Lessons
    existing_lessons = db.query(models.Lesson).count()
    if existing_lessons == 0:
        for l in LESSONS:
            db.add(models.Lesson(**l))
        print(f"[OK] Seeded {len(LESSONS)} lessons.")
    else:
        print(f"[SKIP] Lessons already seeded ({existing_lessons} found).")

    # Demo user
    demo = db.query(models.User).filter(models.User.email == "demo@kaubru.app").first()
    if not demo:
        db.add(models.User(
            name="Demo User",
            email="demo@kaubru.app",
            password_hash=hash_password("demo1234"),
            points=50,
            is_premium=False,
        ))
        print("[OK] Seeded demo user  ->  email: demo@kaubru.app  |  password: demo1234")
    else:
        print("[SKIP] Demo user already exists.")

    db.commit()
    print("\n[DONE] Seed complete!")


def seed_culture_articles():
    """Seed the culture_articles table with initial KauBru cultural content."""
    existing = db.query(models.CultureArticle).count()
    if existing > 0:
        print(f"[SKIP] Culture articles already seeded ({existing} found).")
        return

    for article in CULTURE_ARTICLES:
        db.add(models.CultureArticle(**article))
    db.commit()
    print(f"[OK] Seeded {len(CULTURE_ARTICLES)} culture articles.")


def seed_admin():
    """Create a default admin account."""
    admin = db.query(models.User).filter(models.User.email == "admin@kaubru.app").first()
    if not admin:
        db.add(models.User(
            name="Admin",
            email="admin@kaubru.app",
            password_hash=hash_password("admin1234"),
            role="admin",
            points=0,
            is_premium=True,
        ))
        db.commit()
        print("[OK] Seeded admin  ->  email: admin@kaubru.app  |  password: admin1234")
    else:
        print("[SKIP] Admin already exists.")


if __name__ == "__main__":
    seed()
    seed_admin()
    seed_culture_articles()
    db.close()
