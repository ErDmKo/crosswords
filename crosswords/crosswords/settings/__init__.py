import os

PATH = os.path.realpath(os.path.dirname(__file__))
if os.environ.get('PYTHONPATH'):
    from .heroku import *
elif os.path.exists(os.path.join(PATH, 'local.py')):
    from .local import *
else:   
    from .base import *
