(ns metabase.query-processor.middleware.parameters.mbql
  "Code for handling parameter substitution in MBQL queries."
  (:require [clojure.string :as str]
            [metabase.query-processor.middleware.parameters.dates :as date-params]))

(defn- parse-param-value-for-type
  "Convert PARAM-VALUE to a type appropriate for PARAM-TYPE.
   The frontend always passes parameters in as strings, which is what we want in most cases; for numbers, instead convert the parameters to integers or floating-point numbers."
  [param-type param-value]
  (cond
    ;; no conversion needed if PARAM-TYPE isn't :number or PARAM-VALUE isn't a string
    (or (not= (keyword param-type) :number)
        (not (string? param-value)))        param-value
    ;; if PARAM-VALUE contains a period then convert to a Double
    (re-find #"\." param-value)             (Double/parseDouble param-value)
    ;; otherwise convert to a Long
    :else                                   (Long/parseLong param-value)))

(defn- build-filter-clause [{param-type :type, param-value :value, [_ field] :target}]
  (let [param-value (parse-param-value-for-type param-type param-value)]
    (cond
      ;; default behavior (non-date filtering) is to use a simple equals filter
      (not (str/starts-with? param-type "date")) ["=" field param-value]
      ;; date range
      :else (date-params/date-string->filter param-value field))))

(defn- merge-filter-clauses [base addtl]
  (cond
    (and (seq base)
         (seq addtl)) ["AND" base addtl]
    (seq base)        base
    (seq addtl)       addtl
    :else             []))

(defn expand
  "Expand parameters for MBQL queries in QUERY-DICT (replacing Dashboard or Card-supplied params with the appropriate values in the queries themselves)."
  [query-dict [{:keys [target value], :as param} & rest]]
  (cond
    (not param)      query-dict
    (or (not target)
        (not value)) (recur query-dict rest)
    :else            (let [filter-subclause (build-filter-clause param)
                           query            (assoc-in query-dict [:query :filter] (merge-filter-clauses (get-in query-dict [:query :filter]) filter-subclause))]
                       (recur query rest))))
