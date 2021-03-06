FROM ghcr.io/buildinglink/baseline:latest
LABEL org.opencontainers.image.source https://github.com/BuildingLink/Rome

EXPOSE 25

RUN apt-get update && \
  apt-get install --no-install-recommends -y \
  exim4-daemon-light mailutils net-tools xtail vim telnet && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/man/?? /usr/share/man/??_* && \
  find /var/log -type f | while read f; do echo -ne '' > $f; done;

# add the exim4 start script
COPY start.sh /exim_start

# add and install health checks
COPY health/health.js health/package.json /home/node/
RUN cd /home/node && yarn install


ENTRYPOINT ["/exim_start"]
