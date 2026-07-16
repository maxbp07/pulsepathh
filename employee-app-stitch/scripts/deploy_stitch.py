"""
Deploy PulsePath (Stitch) PWA al VPS MatForge 158.220.119.17.
- SFTP recursivo de dist/ -> /opt/pulsepath-stitch
- Añade location /pulsepath/ a nginx (sin tocar el proxy n8n de /)
- nginx -t + reload + verificación
"""
import os
import stat
import paramiko

HOST = '158.220.119.17'
USER = 'root'
KEY = r'C:\Users\maxbp\.ssh\matforge_vps'
LOCAL_DIST = r'C:\Users\maxbp\pulsepath-v2\employee-app-stitch\dist'
REMOTE_DIR = '/opt/pulsepath-stitch'
NGINX_CONF = '/etc/nginx/sites-available/n8n'

LOCATION_BLOCK = """
    location /pulsepath/ {
        alias /opt/pulsepath-stitch/;
        index index.html;
        try_files $uri $uri/ /pulsepath/index.html;
    }
"""


def connect():
    key = paramiko.Ed25519Key.from_private_key_file(KEY)
    cl = paramiko.SSHClient()
    cl.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    cl.connect(HOST, username=USER, pkey=key, timeout=20)
    return cl


def run(cl, cmd, check=True):
    _, out, err = cl.exec_command(cmd)
    code = out.channel.recv_exit_status()
    o = out.read().decode(errors='replace')
    e = err.read().decode(errors='replace')
    print(f"$ {cmd}")
    if o.strip():
        print(o.rstrip())
    if e.strip():
        print(f"[stderr] {e.rstrip()}")
    if check and code != 0:
        raise RuntimeError(f"comando falló ({code}): {cmd}")
    return o, e, code


def sftp_mkdirs(sftp, path):
    parts = path.strip('/').split('/')
    cur = ''
    for p in parts:
        cur += '/' + p
        try:
            sftp.stat(cur)
        except FileNotFoundError:
            sftp.mkdir(cur)


def upload_dir(sftp, local, remote):
    sftp_mkdirs(sftp, remote)
    n = 0
    for root, _dirs, files in os.walk(local):
        rel = os.path.relpath(root, local).replace('\\', '/')
        rdir = remote if rel == '.' else f"{remote}/{rel}"
        sftp_mkdirs(sftp, rdir)
        for f in files:
            lp = os.path.join(root, f)
            rp = f"{rdir}/{f}"
            sftp.put(lp, rp)
            n += 1
    return n


def install_nginx_location(cl):
    current, _, _ = run(cl, f'cat {NGINX_CONF}', check=False)
    if '/pulsepath/' in current:
        print("location /pulsepath/ ya presente en nginx; no se reescribe.")
        return
    run(cl, f'cp {NGINX_CONF} {NGINX_CONF}.bak.$(date +%s)')
    # Insertar el bloque location justo después de la línea server_name
    lines = current.splitlines()
    out = []
    inserted = False
    for line in lines:
        out.append(line)
        if not inserted and line.strip().startswith('server_name'):
            out.append(LOCATION_BLOCK.rstrip('\n'))
            inserted = True
    if not inserted:
        out.append(LOCATION_BLOCK.rstrip('\n'))
    new_conf = '\n'.join(out) + '\n'
    sftp = cl.open_sftp()
    with sftp.open(NGINX_CONF, 'w') as fh:
        fh.write(new_conf)
    sftp.close()
    print("location /pulsepath/ añadida a", NGINX_CONF)


def main():
    if not os.path.isdir(LOCAL_DIST):
        raise SystemExit(f"No existe {LOCAL_DIST}. Ejecuta npm run build primero.")
    cl = connect()
    try:
        sftp = cl.open_sftp()
        print(f"Limpiando {REMOTE_DIR} ...")
        run(cl, f'rm -rf {REMOTE_DIR} && mkdir -p {REMOTE_DIR}')
        n = upload_dir(sftp, LOCAL_DIST, REMOTE_DIR)
        sftp.close()
        print(f"Subidos {n} archivos a {REMOTE_DIR}")

        run(cl, f'chown -R www-data:www-data {REMOTE_DIR} 2>/dev/null || true', check=False)

        install_nginx_location(cl)
        run(cl, 'nginx -t')
        run(cl, 'systemctl reload nginx')
        print("\nVerificación:")
        run(cl, 'curl -s -o /dev/null -w "HTTP %{http_code}\\n" http://127.0.0.1/pulsepath/')
        run(cl, 'curl -s -o /dev/null -w "manifest HTTP %{http_code}\\n" http://127.0.0.1/pulsepath/manifest.webmanifest')
        print("\n[DEPLOY OK] -> http://158.220.119.17/pulsepath/")
    finally:
        cl.close()


if __name__ == '__main__':
    main()
