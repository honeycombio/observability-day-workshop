import os
from flask import Flask, jsonify
import random

app = Flask(__name__)

filenames = [
"Angrybird.JPG",
"Arco&Tub.png",
"IMG_9343.jpg",
"heatmap.png",
"angry-lemon-ufo.JPG",
"austintiara4.png",
"baby-geese.jpg",
"bbq.jpg",
"beach.JPG",
"bunny-mask.jpg",
"busted-light.jpg",
"cat-glowing-eyes.JPG",
"cat-on-leash.JPG",
"cat-with-bowtie.heic",
"cat.jpg",
"clementine.png",
"cow-peeking.jpg",
"different-animals-01.png",
"dratini.png",
"everything-is-an-experiment.png",
"experiment.png",
"fine-food.jpg",
"flower.jpg",
"frenwho.png",
"genshin-spa.jpg",
"grass-and-desert-guy.png",
"honeycomb-dogfood-logo.png",
"horse-maybe.png",
"is-this-emeri.png",
"jean-and-statue.png",
"jessitron.png",
"keys-drying.jpg",
"lime-on-soap-dispenser.jpg",
"loki-closeup.jpg",
"lynia.png",
"ninguang-at-work.png",
"paul-r-allen.png",
"please.png",
"roswell-nose.jpg",
"roswell.JPG",
"salt-packets-in-jar.jpg",
"scarred-character.png",
"square-leaf-with-nuts.jpg",
"stu.jpeg",
"sweating-it.png",
"tanuki.png",
"tennessee-sunset.JPG",
"this-is-fine-trash.jpg",
"three-pillars-2.png",
"trash-flat.jpg",
"walrus-painting.jpg",
"windigo.png",
"yellow-lines.JPG",
]

BUCKET_NAME = os.environ.get("BUCKET_NAME", "random-pictures")
# Generate URLs using list comprehension
IMAGE_URLS = [f"https://{BUCKET_NAME}.s3.amazonaws.com/{filename}" for filename in filenames]

# Route for health check
@app.route('/health')
def health():
    return jsonify({"message": "I am here, ready to pick an image", "status_code": 0})

# Route for getting a random phrase
@app.route('/imageUrl')
def get_image_url():
    phrase = choose(IMAGE_URLS)
    # You can implement tracing logic here if needed
    return jsonify({"imageUrl": phrase})

# Helper function to choose a random item from a list
def choose(array):
    return random.choice(array)

if __name__ == '__main__':
    app.run(debug=True, port=10114)
