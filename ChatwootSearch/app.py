import os
import logging
import requests
from flask import Flask, render_template, request, jsonify

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create a Flask application
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "chatwoot-search-app-secret")

@app.route('/')
def index():
    """Render the main page of the application."""
    return render_template('index.html')

@app.route('/api/search', methods=['POST'])
def search_contacts():
    """Proxy endpoint for searching contacts in Chatwoot."""
    data = request.json
    
    if not data or not all(k in data for k in ('apiUrl', 'accountId', 'apiToken', 'searchTerm')):
        return jsonify({'error': 'Parâmetros inválidos'}), 400
    
    api_url = f"{data['apiUrl']}/api/v1/accounts/{data['accountId']}/contacts/search?q={data['searchTerm']}"
    
    try:
        response = requests.get(
            api_url,
            headers={
                'api_access_token': data['apiToken'],
                'Content-Type': 'application/json'
            }
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        logging.error(f"Erro ao buscar contatos: {str(e)}")
        return jsonify({'error': f'Falha ao buscar contatos: {str(e)}'}), 500

@app.route('/api/contact/<contact_id>', methods=['POST'])
def get_contact_details(contact_id):
    """Proxy endpoint for fetching contact details from Chatwoot."""
    data = request.json
    
    if not data or not all(k in data for k in ('apiUrl', 'accountId', 'apiToken')):
        return jsonify({'error': 'Parâmetros inválidos'}), 400
    
    api_url = f"{data['apiUrl']}/api/v1/accounts/{data['accountId']}/contacts/{contact_id}"
    
    try:
        response = requests.get(
            api_url,
            headers={
                'api_access_token': data['apiToken'],
                'Content-Type': 'application/json'
            }
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        logging.error(f"Erro ao buscar detalhes do contato: {str(e)}")
        return jsonify({'error': f'Falha ao buscar detalhes do contato: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
