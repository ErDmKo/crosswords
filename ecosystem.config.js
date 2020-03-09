module.exports = {
  apps : [{
    name: 'djangoAPI',
    script: '.env/bin/uwsgi',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: ` --socket ./socket --wsgi-file ./crosswords/wsgi.py --master --processes 4 --threads 2 --chmod-socket=666 --enable-threads --chdir ./crosswords`,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
