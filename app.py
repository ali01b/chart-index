from flask import Flask, render_template
from flask_cors import CORS

app = Flask(__name__, template_folder="html")

CORS(app)  # Tüm domainlere izin verir

@app.route('/')
def index():
    return render_template("index.html")


@app.route('/charts/erolatasoy')
def render_chart():
    return render_template("charts/erolatasoy-chart.html")


@app.route('/charts/main')
def chart():
    return render_template("charts/main.html")


if __name__ == '__main__':
    app.run(port=5050, debug=True)
