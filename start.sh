#!/bin/bash

conf=/etc/exim4/update-exim4.conf.conf
echo "# exim config" >$conf

echo "dc_eximconfig_configtype='smarthost'" >>$conf
echo "dc_other_hostnames='$HOSTNAME'" >>$conf
echo "dc_relay_nets='$EXIM_ALLOWED_SENDERS'" >>$conf
echo "dc_relay_domains='$EXIM_ALLOWED_DOMAINS'" >>$conf
echo "dc_smarthost='email-smtp.${SES_REGION:=us-east-1}.amazonaws.com::${SES_PORT:=587}'" >>$conf
echo "dc_smtp_accept_max='$EXIM_ACCEPT_MAX'" >>$conf
echo "dc_smtp_accept_max_per_host='$EXIM_ACCEPT_MAX_PER_HOST'" >>$conf
echo "dc_smtp_accept_max_per_connection='EXIM_ACCEPT_MAX_PER_CONNECTION'" >>$conf
echo "dc_smtp_accept_queue_per_connection='$EXIM_ACCEPT_QUEUE_PER_CONNECTION'" >>$conf
echo "dc_smtp_connect_backlog='$EXIM_CONNECT_BACKLOG'" >>$conf
echo "disable_ipv6='true'" >>$conf
echo "CFILEMODE='644'" >>$conf$()

# Test if EXIM_MESSAGE_SIZE_LIMIT if set?..
if [[ -v EXIM_MESSAGE_SIZE_LIMIT ]]; then
  echo "...setting MESSAGE_SIZE_LIMIT to $EXIM_MESSAGE_SIZE_LIMIT ..."
  echo "MESSAGE_SIZE_LIMIT=$EXIM_MESSAGE_SIZE_LIMIT" >>$conf
fi

# Update passwd.client
echo "*.amazonaws.com:$SES_USER:$SES_PASSWORD" >/etc/exim4/passwd.client

# Update configuration
update-exim4.conf

# Sort of hack to send logs to stdout
xtail /var/log/exim4 &
XTAIL_PID=$!

# Start exim
/usr/sbin/exim4 ${*:--bdf -q15m} &
EXIM_PID=$!

# Add a signal trap to clean up the child processs
clean_up() {
  echo "killing exim ($EXIM_PID)"
  kill $EXIM_PID
}
trap clean_up SIGHUP SIGINT SIGTERM

# Wait for the exim process to exit
wait $EXIM_PID
EXIT_STATUS=$?

# Kill the xtail process
echo "killing xtail ($XTAIL_PID)"
kill $XTAIL_PID

exit $EXIT_STATUS
