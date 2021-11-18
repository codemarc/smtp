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

ENV EXIM_LOCALINTERFACE=0.0.0.0
ENV EXIM_ALLOWED_SENDERS=10.1.0.0/22:10.1.20.0/24:10.1.40.0/22:10.2.1.0/24
ENV EXIM_ALLOWED_DOMAINS=buildinglink.com:blk-test.com:blkqa.com
ENV EXIM_ACCEPT_MAX_PER_HOST=0
ENV EXIM_ACCEPT_MAX=0


ENTRYPOINT ["/exim_start"]
