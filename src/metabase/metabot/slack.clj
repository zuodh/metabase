(ns metabase.metabot.slack
  "Logic related to posting messages [synchronously and asynchronously] to Slack and handling errors."
  (:require [clojure.tools.logging :as log]
            [metabase.integrations.slack :as slack]
            [metabase.util.i18n :refer [trs tru]]))

(def ^:private ^:dynamic *channel-id* nil)

(defn do-with-channel-id
  "Impl for `with-channel-id` macro."
  [channel-id f]
  (binding [*channel-id* channel-id]
    (f)))

(defn with-channel-id
  "Execute `body` with `channel-id` as the current Slack channel; all messages will be posted to that channel. (This is
  bound to the channel that recieved the MetaBot command we're currently handling by the
  `metabase.metabot.events/handle-slack-event` event handler.)"
  {:style/indent 1}
  [channel-id & body]
  `(do-with-channel-id ~channel-id (fn [] ~@body)))

(def ^{:arglists '([text-or-nil] [text-or-nil attachments])} post-chat-message!
  "Post a MetaBot response Slack message. Goes to channel where the MetaBot command we're replying to was posted."
  (partial slack/post-chat-message! *channel-id*))

(defn format-exception
  "Format a `Throwable` the way we'd like for posting it on Slack."
  [^Throwable e]
  (str (tru "Uh oh! :cry:\n> {0}" (.getMessage e))))

(defn do-async
  "Impl for `async` macro."
  [f]
  (future
    (try
      (f)
      (catch Throwable e
        (log/error e (trs "Error in Metabot command"))
        (post-chat-message! (format-exception e))))
    nil))

(defmacro async
  "Execute `body` asynchronously, wrapped in a try-catch block. If an Exception is thrown, replies to the current Slack
  channel with the exception message and logs the complete Exception to the logs."
  {:style/indent 0}
  [& body]
  `(do-async (fn [] ~@body)))
