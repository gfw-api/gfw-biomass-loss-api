import ee
import os
import json


def _load_asset_ids():
    """Return private EE asset ids as dictionary."""
    path = os.path.join(os.path.abspath(
        os.path.dirname(__file__)), '../../../../ee_asset_ids.json')
    try:
        return json.loads(open(path, "r").read())
    except:
        return {}

EE_URL = 'https://earthengine.googleapis.com'
EE_ACCOUNT= '390573081381-lm51tabsc8q8b33ik497hc66qcmbj11d@developer.gserviceaccount.com'
EE_PRIVATE_KEY_FILE = 'privatekey.pem'

EE_CREDENTIALS = ee.ServiceAccountCredentials(EE_ACCOUNT, EE_PRIVATE_KEY_FILE)

assets = _load_asset_ids()
