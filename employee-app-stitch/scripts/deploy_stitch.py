"""
DEPRECATED — el despliegue canónico de employee-app-stitch es Contabo
(app.getpulsepath.com en la raíz), no un subpath /pulsepath/.

Ver: docs/HTTPS_SETUP.md y deploy-prod.sh

Este script ya no muta nginx. Solo documenta el host canónico.
Host VPS: 161.97.69.228
"""
import sys

HOST = '161.97.69.228'
CANONICAL_URL = 'https://app.getpulsepath.com'


def main():
    print(
        'deploy_stitch.py está obsoleto.\n'
        f'Usar Contabo {HOST} → {CANONICAL_URL} (VITE_BASE_PATH=/).\n'
        'Ver docs/HTTPS_SETUP.md y ./deploy-prod.sh'
    )
    sys.exit(1)


if __name__ == '__main__':
    main()
