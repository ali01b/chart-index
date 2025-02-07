from flask import Flask, render_template
from flask_cors import CORS

app = Flask(__name__, template_folder="html")

CORS(app)  # Tüm domainlere izin verir

@app.route('/')
def index():
    return render_template("index.html")


@app.route('/chart')
def chart():
    return render_template("chart.html")


if __name__ == '__main__':
    app.run(port=8080, debug=True)
