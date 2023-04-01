// most of this code is taken from https://github.com/Qalculate/libqalculate/blob/master/src/qalc.cc in order to support the set commands

#include <libqalculate/qalculate.h>

using std::string;
using std::vector;

#define _(x) x
#define _c(a, b) a b
#define signal(a, b) 0
#define SIGINT 0
#define SIG_DFL 0
#define sigint_handler 0

#define EQUALS_IGNORECASE_AND_LOCAL(x, y, z) (equalsIgnoreCase(x, y) || equalsIgnoreCase(x, z))
#define EQUALS_IGNORECASE_AND_LOCAL_NR(x, y, z, a) (equalsIgnoreCase(x, y a) || (x.length() == strlen(z) + strlen(a) && equalsIgnoreCase(x.substr(0, x.length() - strlen(a)), z) && equalsIgnoreCase(x.substr(x.length() - strlen(a)), a)))
#ifdef _WIN32
LPWSTR utf8wchar(const char *str)
{
	size_t len = strlen(str) + 1;
	int size_needed = MultiByteToWideChar(CP_UTF8, 0, str, len, NULL, 0);
	LPWSTR wstr = (LPWSTR)LocalAlloc(LPTR, sizeof(WCHAR) * size_needed);
	MultiByteToWideChar(CP_UTF8, 0, str, len, wstr, size_needed);
	return wstr;
}
#define PUTS_UNICODE(x)                   \
	if (!contains_unicode_char(x))        \
	{                                     \
		puts(x);                          \
	}                                     \
	else if (printops.use_unicode_signs)  \
	{                                     \
		fputws(utf8wchar(x), stdout);     \
		puts("");                         \
	}                                     \
	else                                  \
	{                                     \
		char *gstr = locale_from_utf8(x); \
		if (gstr)                         \
		{                                 \
			puts(gstr);                   \
			free(gstr);                   \
		}                                 \
		else                              \
		{                                 \
			puts(x);                      \
		}                                 \
	}
#define FPUTS_UNICODE(x, y)               \
	if (!contains_unicode_char(x))        \
	{                                     \
		fputs(x, y);                      \
	}                                     \
	else if (printops.use_unicode_signs)  \
	{                                     \
		fputws(utf8wchar(x), y);          \
	}                                     \
	else                                  \
	{                                     \
		char *gstr = locale_from_utf8(x); \
		if (gstr)                         \
		{                                 \
			fputs(gstr, y);               \
			free(gstr);                   \
		}                                 \
		else                              \
		{                                 \
			fputs(x, y);                  \
		}                                 \
	}
#else
#define PUTS_UNICODE(x)                                          \
	if (printops.use_unicode_signs || !contains_unicode_char(x)) \
	{                                                            \
		puts(x);                                                 \
	}                                                            \
	else                                                         \
	{                                                            \
		char *gstr = locale_from_utf8(x);                        \
		if (gstr)                                                \
		{                                                        \
			puts(gstr);                                          \
			free(gstr);                                          \
		}                                                        \
		else                                                     \
		{                                                        \
			puts(x);                                             \
		}                                                        \
	}
#define FPUTS_UNICODE(x, y)                                      \
	if (printops.use_unicode_signs || !contains_unicode_char(x)) \
	{                                                            \
		fputs(x, y);                                             \
	}                                                            \
	else                                                         \
	{                                                            \
		char *gstr = locale_from_utf8(x);                        \
		if (gstr)                                                \
		{                                                        \
			fputs(gstr, y);                                      \
			free(gstr);                                          \
		}                                                        \
		else                                                     \
		{                                                        \
			fputs(x, y);                                         \
		}                                                        \
	}
#endif
#define SET_BOOL(x)                            \
	{                                          \
		int v = s2b(svalue);                   \
		if (v < 0)                             \
		{                                      \
			PUTS_UNICODE(_("Illegal value.")); \
		}                                      \
		else if (x != v)                       \
		{                                      \
			x = v;                             \
		}                                      \
	}
#define SET_BOOL_D(x)                          \
	{                                          \
		int v = s2b(svalue);                   \
		if (v < 0)                             \
		{                                      \
			PUTS_UNICODE(_("Illegal value.")); \
		}                                      \
		else if (x != v)                       \
		{                                      \
			x = v;                             \
			result_display_updated();          \
		}                                      \
	}
#define SET_BOOL_E(x)                          \
	{                                          \
		int v = s2b(svalue);                   \
		if (v < 0)                             \
		{                                      \
			PUTS_UNICODE(_("Illegal value.")); \
		}                                      \
		else if (x != v)                       \
		{                                      \
			x = v;                             \
			expression_calculation_updated();  \
		}                                      \
	}
#define SET_BOOL_PV(x)                         \
	{                                          \
		int v = s2b(svalue);                   \
		if (v < 0)                             \
		{                                      \
			PUTS_UNICODE(_("Illegal value.")); \
		}                                      \
		else if (x != v)                       \
		{                                      \
			x = v;                             \
			expression_format_updated(v);      \
		}                                      \
	}
#define SET_BOOL_PT(x)                         \
	{                                          \
		int v = s2b(svalue);                   \
		if (v < 0)                             \
		{                                      \
			PUTS_UNICODE(_("Illegal value.")); \
		}                                      \
		else if (x != v)                       \
		{                                      \
			x = v;                             \
			expression_format_updated(true);   \
		}                                      \
	}
#define SET_BOOL_PF(x)                         \
	{                                          \
		int v = s2b(svalue);                   \
		if (v < 0)                             \
		{                                      \
			PUTS_UNICODE(_("Illegal value.")); \
		}                                      \
		else if (x != v)                       \
		{                                      \
			x = v;                             \
			expression_format_updated(false);  \
		}                                      \
	}
#define RESET_TZ                                                        \
	printops.custom_time_zone = (rounding_mode == 2 ? TZ_TRUNCATE : 0); \
	if (use_duo_syms)                                                   \
		printops.custom_time_zone += TZ_DOZENAL;                        \
	printops.time_zone = TIME_ZONE_LOCAL;

MathStructure *mstruct, *parsed_mstruct, mstruct_exact, prepend_mstruct;
KnownVariable *vans[5], *v_memory;
string result_text, parsed_text, original_expression;
vector<string> alt_results;
bool load_global_defs, fetch_exchange_rates_at_startup, first_time, save_mode_on_exit, save_defs_on_exit, clear_history_on_exit, load_defaults = false;
int auto_update_exchange_rates;
bool complex_angle_form = false, saved_caf = false;
bool dot_question_asked = false, implicit_question_asked = false;
Number saved_custom_output_base, saved_custom_input_base;
AssumptionType saved_assumption_type;
AssumptionSign saved_assumption_sign;
int saved_precision;
int saved_binary_prefixes;
bool saved_interval, saved_adaptive_interval_display, saved_variable_units_enabled;
bool adaptive_interval_display;
Thread *view_thread, *command_thread;
bool command_aborted = false;
volatile bool b_busy = false;
string expression_str;
bool expression_executed = false;
bool avoid_recalculation = false;
bool hide_parse_errors = false;
ParsingMode nonrpn_parsing_mode = PARSING_MODE_ADAPTIVE, saved_parsing_mode;
bool saved_percent;
bool rpn_mode = false, saved_rpn_mode = false;
bool caret_as_xor = false, saved_caret_as_xor = false;
bool use_readline = true;
bool interactive_mode = false;
int colorize = 0;
int force_color = -1;
bool ask_questions = false;
bool canfetch = true;
bool programmers_mode = false;
int b_decimal_comma = -1;
long int i_maxtime = 0;
struct timeval t_end;
int dual_fraction = -1, saved_dual_fraction = -1;
int dual_approximation = -1, saved_dual_approximation = -1;
bool tc_set = false, sinc_set = false;
bool ignore_locale = false;
bool result_only = false, vertical_space = true;
bool do_imaginary_j = false;
int sigint_action = 1;
bool unittest = false;
int rounding_mode = 0, saved_rounding = 0;
bool simplified_percentage = true;
int defs_edited = 0;
bool use_duo_syms = false;
int enable_unicode = -1;

#define result_display_updated() 0
#define result_format_updated() 0
#define result_action_executed() 0
#define result_prefix_changed(_) 0
#define expression_format_updated(_) 0
#define expression_calculation_updated() 0

bool contains_unicode_char(const char *str)
{
	for (int i = strlen(str) - 1; i >= 0; i--)
	{
		if ((signed char)str[i] < 0)
			return true;
	}
	return false;
}

int s2b(const string &str)
{
	if (str.empty())
		return -1;
	if (EQUALS_IGNORECASE_AND_LOCAL(str, "yes", _("yes")))
		return 1;
	if (EQUALS_IGNORECASE_AND_LOCAL(str, "no", _("no")))
		return 0;
	if (EQUALS_IGNORECASE_AND_LOCAL(str, "true", _("true")))
		return 1;
	if (EQUALS_IGNORECASE_AND_LOCAL(str, "false", _("false")))
		return 0;
	if (EQUALS_IGNORECASE_AND_LOCAL(str, "on", _("on")))
		return 1;
	if (EQUALS_IGNORECASE_AND_LOCAL(str, "off", _("off")))
		return 0;
	if (str.find_first_not_of(SPACES NUMBERS) != string::npos)
		return -1;
	int i = s2i(str);
	if (i > 0)
		return 1;
	return 0;
}

bool set_assumption(const string &str, bool last_of_two = false)
{
	// assumptions
	if (EQUALS_IGNORECASE_AND_LOCAL(str, "none", _("none")) || str == "0")
	{
		CALCULATOR->defaultAssumptions()->setType(ASSUMPTION_TYPE_NUMBER);
		CALCULATOR->defaultAssumptions()->setSign(ASSUMPTION_SIGN_UNKNOWN);
		// assumptions
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(str, "unknown", _("unknown")))
	{
		if (!last_of_two)
		{
			CALCULATOR->defaultAssumptions()->setSign(ASSUMPTION_SIGN_UNKNOWN);
		}
		else
		{
			CALCULATOR->defaultAssumptions()->setType(ASSUMPTION_TYPE_NUMBER);
		}
		// real number
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(str, "real", _("real")))
	{
		CALCULATOR->defaultAssumptions()->setType(ASSUMPTION_TYPE_REAL);
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(str, "number", _("number")) || str == "num")
	{
		CALCULATOR->defaultAssumptions()->setType(ASSUMPTION_TYPE_NUMBER);
		// complex number
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(str, "complex", _("complex")) || str == "cplx")
	{
		CALCULATOR->defaultAssumptions()->setType(ASSUMPTION_TYPE_NUMBER);
		// rational number
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(str, "rational", _("rational")) || str == "rat")
	{
		CALCULATOR->defaultAssumptions()->setType(ASSUMPTION_TYPE_RATIONAL);
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(str, "integer", _("integer")) || str == "int")
	{
		CALCULATOR->defaultAssumptions()->setType(ASSUMPTION_TYPE_INTEGER);
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(str, "boolean", _("boolean")) || str == "bool")
	{
		CALCULATOR->defaultAssumptions()->setType(ASSUMPTION_TYPE_BOOLEAN);
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(str, "non-zero", _("non-zero")) || str == "nz")
	{
		CALCULATOR->defaultAssumptions()->setSign(ASSUMPTION_SIGN_NONZERO);
		// positive number
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(str, "positive", _("positive")) || str == "pos")
	{
		CALCULATOR->defaultAssumptions()->setSign(ASSUMPTION_SIGN_POSITIVE);
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(str, "non-negative", _("non-negative")) || str == "nneg")
	{
		CALCULATOR->defaultAssumptions()->setSign(ASSUMPTION_SIGN_NONNEGATIVE);
		// negative number
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(str, "negative", _("negative")) || str == "neg")
	{
		CALCULATOR->defaultAssumptions()->setSign(ASSUMPTION_SIGN_NEGATIVE);
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(str, "non-positive", _("non-positive")) || str == "npos")
	{
		CALCULATOR->defaultAssumptions()->setSign(ASSUMPTION_SIGN_NONPOSITIVE);
	}
	else
	{
		return false;
	}
	return true;
}

bool set_option(string str)
{
	bool success = true;
	remove_blank_ends(str);
	string svalue, svar;
	bool empty_value = false;
	size_t i_underscore = str.find("_");
	size_t index;
	if (i_underscore != string::npos)
	{
		index = str.find_first_of(SPACES);
		if (index != string::npos && i_underscore > index)
			i_underscore = string::npos;
	}
	if (i_underscore == string::npos)
		index = str.find_last_of(SPACES);
	if (index != string::npos)
	{
		svar = str.substr(0, index);
		remove_blank_ends(svar);
		svalue = str.substr(index + 1);
		remove_blank_ends(svalue);
	}
	else
	{
		svar = str;
	}
	if (i_underscore != string::npos)
		gsub("_", " ", svar);
	if (svalue.empty())
	{
		empty_value = true;
		svalue = "1";
	}
	else
	{
		gsub(SIGN_MINUS, "-", svalue);
	}

set_option_place:
	// number base
	if (EQUALS_IGNORECASE_AND_LOCAL(svar, "base", _("base")) || EQUALS_IGNORECASE_AND_LOCAL(svar, "input base", _("input base")) || svar == "inbase" || EQUALS_IGNORECASE_AND_LOCAL(svar, "output base", _("output base")) || svar == "outbase")
	{
		int v = 0;
		bool b_in = EQUALS_IGNORECASE_AND_LOCAL(svar, "input base", _("input base")) || svar == "inbase";
		bool b_out = EQUALS_IGNORECASE_AND_LOCAL(svar, "output base", _("output base")) || svar == "outbase";
		// roman numerals
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "roman", _("roman")))
			v = BASE_ROMAN_NUMERALS;
		// number base
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "bijective", _("bijective")) || svalue == "b26" || svalue == "B26")
			v = BASE_BIJECTIVE_26;
		else if (equalsIgnoreCase(svalue, "bcd"))
			v = BASE_BINARY_DECIMAL;
		else if (equalsIgnoreCase(svalue, "fp32") || equalsIgnoreCase(svalue, "binary32") || equalsIgnoreCase(svalue, "float"))
		{
			if (b_in)
				v = 0;
			else
				v = BASE_FP32;
		}
		else if (equalsIgnoreCase(svalue, "fp64") || equalsIgnoreCase(svalue, "binary64") || equalsIgnoreCase(svalue, "double"))
		{
			if (b_in)
				v = 0;
			else
				v = BASE_FP64;
		}
		else if (equalsIgnoreCase(svalue, "fp16") || equalsIgnoreCase(svalue, "binary16"))
		{
			if (b_in)
				v = 0;
			else
				v = BASE_FP16;
		}
		else if (equalsIgnoreCase(svalue, "fp80"))
		{
			if (b_in)
				v = 0;
			else
				v = BASE_FP80;
		}
		else if (equalsIgnoreCase(svalue, "fp128") || equalsIgnoreCase(svalue, "binary128"))
		{
			if (b_in)
				v = 0;
			else
				v = BASE_FP128;
		}
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "time", _("time")))
		{
			if (b_in)
				v = 0;
			else
				v = BASE_TIME;
		}
		else if (equalsIgnoreCase(svalue, "hex") || EQUALS_IGNORECASE_AND_LOCAL(svalue, "hexadecimal", _("hexadecimal")))
			v = BASE_HEXADECIMAL;
		else if (equalsIgnoreCase(svalue, "golden") || equalsIgnoreCase(svalue, "golden ratio") || svalue == "φ")
			v = BASE_GOLDEN_RATIO;
		else if (equalsIgnoreCase(svalue, "supergolden") || equalsIgnoreCase(svalue, "supergolden ratio") || svalue == "ψ")
			v = BASE_SUPER_GOLDEN_RATIO;
		else if (equalsIgnoreCase(svalue, "pi") || svalue == "π")
			v = BASE_PI;
		else if (svalue == "e")
			v = BASE_E;
		else if (svalue == "sqrt(2)" || svalue == "sqrt 2" || svalue == "sqrt2" || svalue == "√2")
			v = BASE_SQRT2;
		else if (equalsIgnoreCase(svalue, "unicode"))
			v = BASE_UNICODE;
		else if (equalsIgnoreCase(svalue, "duo") || EQUALS_IGNORECASE_AND_LOCAL(svalue, "duodecimal", _("duodecimal")))
			v = 12;
		// number base
		else if (equalsIgnoreCase(svalue, "bin") || EQUALS_IGNORECASE_AND_LOCAL(svalue, "binary", _("binary")))
			v = BASE_BINARY;
		else if (equalsIgnoreCase(svalue, "oct") || EQUALS_IGNORECASE_AND_LOCAL(svalue, "octal", _("octal")))
			v = BASE_OCTAL;
		// number base
		else if (equalsIgnoreCase(svalue, "dec") || EQUALS_IGNORECASE_AND_LOCAL(svalue, "decimal", _("decimal")))
			v = BASE_DECIMAL;
		else if (equalsIgnoreCase(svalue, "sexa") || EQUALS_IGNORECASE_AND_LOCAL(svalue, "sexagesimal", _("sexagesimal")))
		{
			if (b_in)
				v = 0;
			else
				v = BASE_SEXAGESIMAL;
		}
		else if (equalsIgnoreCase(svalue, "sexa2") || EQUALS_IGNORECASE_AND_LOCAL_NR(svalue, "sexagesimal", _("sexagesimal"), "2"))
		{
			if (b_in)
				v = 0;
			else
				v = BASE_SEXAGESIMAL_2;
		}
		else if (equalsIgnoreCase(svalue, "sexa3") || EQUALS_IGNORECASE_AND_LOCAL_NR(svalue, "sexagesimal", _("sexagesimal"), "3"))
		{
			if (b_in)
				v = 0;
			else
				v = BASE_SEXAGESIMAL_3;
		}
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "latitude", _("latitude")))
		{
			if (b_in)
				v = 0;
			else
				v = BASE_LATITUDE;
		}
		else if (EQUALS_IGNORECASE_AND_LOCAL_NR(svalue, "latitude", _("latitude"), "2"))
		{
			if (b_in)
				v = 0;
			else
				v = BASE_LATITUDE_2;
		}
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "longitude", _("longitude")))
		{
			if (b_in)
				v = 0;
			else
				v = BASE_LONGITUDE;
		}
		else if (EQUALS_IGNORECASE_AND_LOCAL_NR(svalue, "longitude", _("longitude"), "2"))
		{
			if (b_in)
				v = 0;
			else
				v = BASE_LONGITUDE_2;
		}
		else if (!b_in && !b_out && (index = svalue.find_first_of(SPACES)) != string::npos)
		{
			str = svalue;
			svalue = str.substr(index + 1, str.length() - (index + 1));
			remove_blank_ends(svalue);
			svar += " ";
			str = str.substr(0, index);
			remove_blank_ends(str);
			svar += str;
			gsub("_", " ", svar);
			if (EQUALS_IGNORECASE_AND_LOCAL(svar, "base display", _("base display")))
			{
				goto set_option_place;
			}
			if (expression_executed)
			{
				expression_executed = false;
				success &= set_option(string("outbase ") + str);
				expression_executed = true;
			}
			else
			{
				success &= set_option(string("outbase ") + str);
			}
			success &= set_option(string("inbase ") + svalue);
			return success;
		}
		else if (!empty_value)
		{
			MathStructure m;
			EvaluationOptions eo = evalops;
			eo.parse_options.base = 10;
			eo.approximation = APPROXIMATION_TRY_EXACT;
			CALCULATOR->beginTemporaryStopMessages();
			CALCULATOR->calculate(&m, CALCULATOR->unlocalizeExpression(svalue, eo.parse_options), 500, eo);
			if (CALCULATOR->endTemporaryStopMessages())
			{
				v = 0;
			}
			else if (m.isInteger() && m.number() >= 2 && m.number() <= 36)
			{
				v = m.number().intValue();
			}
			else if (m.isNumber() && (b_in || ((!m.number().isNegative() || m.number().isInteger()) && (m.number() > 1 || m.number() < -1))))
			{
				v = BASE_CUSTOM;
				if (b_in)
					CALCULATOR->setCustomInputBase(m.number());
				else
					CALCULATOR->setCustomOutputBase(m.number());
			}
		}
		if (v == 0)
		{
			success = false;
			PUTS_UNICODE(_("Illegal base."));
		}
		else if (b_in)
		{
			evalops.parse_options.base = v;
			expression_format_updated(false);
		}
		else
		{
			printops.base = v;
			result_format_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "assumptions", _("assumptions")) || svar == "ass" || svar == "asm")
	{
		size_t i = svalue.find_first_of(SPACES);
		if (i != string::npos)
		{
			success &= set_assumption(svalue.substr(0, i), false);
			success &= set_assumption(svalue.substr(i + 1, svalue.length() - (i + 1)), true);
		}
		else
		{
			success &= set_assumption(svalue, false);
		}
		if (interactive_mode)
		{
			string value;
			if (CALCULATOR->defaultAssumptions()->type() != ASSUMPTION_TYPE_BOOLEAN)
			{
				switch (CALCULATOR->defaultAssumptions()->sign())
				{
				case ASSUMPTION_SIGN_POSITIVE:
				{
					value = _("positive");
					break;
				}
				case ASSUMPTION_SIGN_NONPOSITIVE:
				{
					value = _("non-positive");
					break;
				}
				case ASSUMPTION_SIGN_NEGATIVE:
				{
					value = _("negative");
					break;
				}
				case ASSUMPTION_SIGN_NONNEGATIVE:
				{
					value = _("non-negative");
					break;
				}
				case ASSUMPTION_SIGN_NONZERO:
				{
					value = _("non-zero");
					break;
				}
				default:
				{
				}
				}
			}
			if (!value.empty() && CALCULATOR->defaultAssumptions()->type() != ASSUMPTION_TYPE_NONE)
				value += " ";
			switch (CALCULATOR->defaultAssumptions()->type())
			{
			case ASSUMPTION_TYPE_INTEGER:
			{
				value += _("integer");
				break;
			}
			case ASSUMPTION_TYPE_BOOLEAN:
			{
				value += _("boolean");
				break;
			}
			case ASSUMPTION_TYPE_RATIONAL:
			{
				value += _("rational");
				break;
			}
			case ASSUMPTION_TYPE_REAL:
			{
				value += _("real");
				break;
			}
			// complex number
			case ASSUMPTION_TYPE_COMPLEX:
			{
				value += _("complex");
				break;
			}
			case ASSUMPTION_TYPE_NUMBER:
			{
				value += _("number");
				break;
			}
			case ASSUMPTION_TYPE_NONMATRIX:
			{
				value += _("non-matrix");
				break;
			}
			default:
			{
			}
			}
			if (value.empty())
				value = _("unknown");
			FPUTS_UNICODE(_("assumptions"), stdout);
			fputs(": ", stdout);
			PUTS_UNICODE(value.c_str());
		}
		expression_calculation_updated();
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "all prefixes", _("all prefixes")) || svar == "allpref")
		SET_BOOL_D(printops.use_all_prefixes)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "color", _("color")))
	{
		int v = -1;
		// light color
		if (svalue == "2" || EQUALS_IGNORECASE_AND_LOCAL(svalue, "light", _("light")))
			v = 2;
		else if (svalue == "1" || EQUALS_IGNORECASE_AND_LOCAL(svalue, "default", _("default")))
			v = 1;
		else
			v = s2b(svalue);
		if (v < 0 || v > 2)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			colorize = v;
			result_display_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "complex numbers", _("complex numbers")) || svar == "cplx")
		SET_BOOL_E(evalops.allow_complex)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "excessive parentheses", _("excessive parentheses")) || svar == "expar")
		SET_BOOL_D(printops.excessive_parenthesis)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "functions", _("functions")) || svar == "func")
		SET_BOOL_PV(evalops.parse_options.functions_enabled)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "infinite numbers", _("infinite numbers")) || svar == "inf")
		SET_BOOL_E(evalops.allow_infinite)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "show negative exponents", _("show negative exponents")) || svar == "negexp")
		SET_BOOL_D(printops.negative_exponents)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "minus last", _("minus last")) || svar == "minlast")
	{
		{
			int v = s2b(svalue);
			if (v < 0)
			{
				success = false;
				PUTS_UNICODE(_("Illegal value."));
			}
			else if (printops.sort_options.minus_last != v)
			{
				printops.sort_options.minus_last = v;
				result_display_updated();
			}
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "assume nonzero denominators", _("assume nonzero denominators")) || svar == "nzd")
		SET_BOOL_E(evalops.assume_denominators_nonzero)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "warn nonzero denominators", _("warn nonzero denominators")) || svar == "warnnzd")
		SET_BOOL_E(evalops.warn_about_denominators_assumed_nonzero)
	// unit prefixes
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "prefixes", _("prefixes")) || svar == "prefix" || svar == "pref")
		SET_BOOL_D(printops.use_unit_prefixes)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "binary prefixes", _("binary prefixes")) || svar == "binpref")
	{
		bool b = CALCULATOR->usesBinaryPrefixes() > 0;
		SET_BOOL(b)
		if (b != (CALCULATOR->usesBinaryPrefixes() > 0))
		{
			CALCULATOR->useBinaryPrefixes(b ? 1 : 0);
			result_display_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "denominator prefixes", _("denominator prefixes")) || svar == "denpref")
		SET_BOOL_D(printops.use_denominator_prefix)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "place units separately", _("place units separately")) || svar == "unitsep")
		SET_BOOL_D(printops.place_units_separately)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "calculate variables", _("calculate variables")) || svar == "calcvar")
		SET_BOOL_E(evalops.calculate_variables)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "calculate functions", _("calculate functions")) || svar == "calcfunc")
		SET_BOOL_E(evalops.calculate_functions)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "sync units", _("sync units")) || svar == "sync")
		SET_BOOL_E(evalops.sync_units)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "temperature calculation", _("temperature calculation")) || svar == "temp")
	{
		int v = -1;
		// temperature calculation mode
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "relative", _("relative")))
			v = TEMPERATURE_CALCULATION_RELATIVE;
		// temperature calculation mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "hybrid", _("hybrid")))
			v = TEMPERATURE_CALCULATION_HYBRID;
		// temperature calculation mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "absolute", _("absolute")))
			v = TEMPERATURE_CALCULATION_ABSOLUTE;
		else if (svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < 0 || v > 2)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			CALCULATOR->setTemperatureCalculationMode((TemperatureCalculationMode)v);
			tc_set = true;
			expression_calculation_updated();
		}
	}
	else if (svar == "sinc")
	{
		int v = -1;
		// sinc function variant
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "unnormalized", _("unnormalized")))
			v = 0;
		// sinc function variant
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "normalized", _("normalized")))
			v = 1;
		else if (svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < 0 || v > 1)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			if (v == 0)
				CALCULATOR->getFunctionById(FUNCTION_ID_SINC)->setDefaultValue(2, "");
			else
				CALCULATOR->getFunctionById(FUNCTION_ID_SINC)->setDefaultValue(2, "pi");
			sinc_set = true;
			expression_calculation_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "round to even", _("round to even")) || svar == "rndeven")
	{
		bool b = printops.round_halfway_to_even;
		SET_BOOL(b)
		if (b != printops.round_halfway_to_even || rounding_mode == 2)
		{
			rounding_mode = b ? 0 : 1;
			RESET_TZ
			printops.round_halfway_to_even = b;
			result_format_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "rounding", _("rounding")))
	{
		int v = -1;
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "even", _("even")) || EQUALS_IGNORECASE_AND_LOCAL(svalue, "round to even", _("round to even")))
			v = 1;
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "standard", _("standard")))
			v = 0;
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "truncate", _("truncate")))
			v = 2;
		else if (svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < 0 || v > 2)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else if (v != rounding_mode)
		{
			rounding_mode = v;
			RESET_TZ
			printops.round_halfway_to_even = (v == 1);
			result_format_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "rpn syntax", _("rpn syntax")) || svar == "rpnsyn")
	{
		bool b = (evalops.parse_options.parsing_mode == PARSING_MODE_RPN);
		SET_BOOL(b)
		if (b != (evalops.parse_options.parsing_mode == PARSING_MODE_RPN))
		{
			if (b)
			{
				nonrpn_parsing_mode = evalops.parse_options.parsing_mode;
				evalops.parse_options.parsing_mode = PARSING_MODE_RPN;
			}
			else
			{
				evalops.parse_options.parsing_mode = nonrpn_parsing_mode;
			}
			expression_format_updated(false);
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "rpn", _("rpn")) && svalue.find(" ") == string::npos)
	{
		SET_BOOL(rpn_mode)
		if (!rpn_mode) CALCULATOR->clearRPNStack();
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "simplified percentage", _("simplified percentage")) || svar == "percent")
		SET_BOOL_PT(simplified_percentage)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "short multiplication", _("short multiplication")) || svar == "shortmul")
		SET_BOOL_D(printops.short_multiplication)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "lowercase e", _("lowercase e")) || svar == "lowe")
		SET_BOOL_D(printops.lower_case_e)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "lowercase numbers", _("lowercase numbers")) || svar == "lownum")
		SET_BOOL_D(printops.lower_case_numbers)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "duodecimal symbols", _("duodecimal symbols")) || svar == "duosyms")
	{
		bool b = use_duo_syms;
		SET_BOOL(use_duo_syms)
		if (b != use_duo_syms)
		{
			RESET_TZ
			result_display_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "imaginary j", _("imaginary j")) || svar == "imgj")
	{
		bool b = CALCULATOR->getVariableById(VARIABLE_ID_I)->hasName("j") > 0;
		SET_BOOL(b)
		if (b != (CALCULATOR->getVariableById(VARIABLE_ID_I)->hasName("j") > 0))
		{
			if (b)
			{
				ExpressionName ename = CALCULATOR->getVariableById(VARIABLE_ID_I)->getName(1);
				ename.name = "j";
				ename.reference = false;
				CALCULATOR->getVariableById(VARIABLE_ID_I)->addName(ename, 1, true);
				CALCULATOR->getVariableById(VARIABLE_ID_I)->setChanged(false);
			}
			else
			{
				CALCULATOR->getVariableById(VARIABLE_ID_I)->clearNonReferenceNames();
				CALCULATOR->getVariableById(VARIABLE_ID_I)->setChanged(false);
			}
			result_display_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "base display", _("base display")) || svar == "basedisp")
	{
		int v = -1;
		// base display mode
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "none", _("none")))
			v = BASE_DISPLAY_NONE;
		// base display mode
		else if (empty_value || EQUALS_IGNORECASE_AND_LOCAL(svalue, "normal", _("normal")))
			v = BASE_DISPLAY_NORMAL;
		// base display mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "alternative", _("alternative")))
			v = BASE_DISPLAY_ALTERNATIVE;
		else if (svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < 0 || v > 2)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			printops.base_display = (BaseDisplay)v;
			result_display_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "two's complement", _("two's complement")) || svar == "twos")
		SET_BOOL_D(printops.twos_complement)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "hexadecimal two's", _("hexadecimal two's")) || svar == "hextwos")
		SET_BOOL_D(printops.hexadecimal_twos_complement)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "digit grouping", _("digit grouping")) || svar == "group")
	{
		int v = -1;
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "off", _("off")))
			v = DIGIT_GROUPING_NONE;
		// digit grouping mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "none", _("none")))
			v = DIGIT_GROUPING_NONE;
		// digit grouping mode
		else if (empty_value || EQUALS_IGNORECASE_AND_LOCAL(svalue, "standard", _("standard")) || EQUALS_IGNORECASE_AND_LOCAL(svalue, "on", _("on")))
			v = DIGIT_GROUPING_STANDARD;
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "locale", _("locale")))
			v = DIGIT_GROUPING_LOCALE;
		else if (svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < DIGIT_GROUPING_NONE || v > DIGIT_GROUPING_LOCALE)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			printops.digit_grouping = (DigitGrouping)v;
			result_display_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "spell out logical", _("spell out logical")) || svar == "spellout")
		SET_BOOL_D(printops.spell_out_logical_operators)
	else if ((EQUALS_IGNORECASE_AND_LOCAL(svar, "ignore dot", _("ignore dot")) || svar == "nodot") && CALCULATOR->getDecimalPoint() != DOT)
	{
		dot_question_asked = true;
		SET_BOOL_PF(evalops.parse_options.dot_as_separator)
	}
	else if ((EQUALS_IGNORECASE_AND_LOCAL(svar, "ignore comma", _("ignore comma")) || svar == "nocomma") && CALCULATOR->getDecimalPoint() != COMMA)
	{
		SET_BOOL(evalops.parse_options.comma_as_separator)
		CALCULATOR->useDecimalPoint(evalops.parse_options.comma_as_separator);
		expression_format_updated(false);
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "decimal comma", _("decimal comma")))
	{
		int v = -2;
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "off", _("off")))
			v = 0;
		else if (empty_value || EQUALS_IGNORECASE_AND_LOCAL(svalue, "on", _("on")))
			v = 1;
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "locale", _("locale")))
			v = -1;
		else if (svalue.find_first_not_of(SPACES MINUS NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < -1 || v > 1)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			b_decimal_comma = v;
			if (b_decimal_comma > 0)
				CALCULATOR->useDecimalComma();
			else if (b_decimal_comma == 0)
				CALCULATOR->useDecimalPoint(evalops.parse_options.comma_as_separator);
			if (v >= 0)
			{
				expression_format_updated(false);
				result_display_updated();
			}
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "limit implicit multiplication", _("limit implicit multiplication")) || svar == "limimpl")
	{
		int v = s2b(svalue);
		if (v < 0)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			printops.limit_implicit_multiplication = v;
			evalops.parse_options.limit_implicit_multiplication = v;
			expression_format_updated(true);
		}
		// extra space next to operators
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "spacious", _("spacious")) || svar == "space")
		SET_BOOL_D(printops.spacious)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "vertical space", _("vertical space")) || svar == "vspace")
		SET_BOOL(vertical_space)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "unicode", _("unicode")) || svar == "uni")
	{
		int v = s2b(svalue);
		if (v < 0)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			printops.use_unicode_signs = v;
			result_display_updated();
		}
		enable_unicode = -1;
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "units", _("units")) || svar == "unit")
		SET_BOOL_PV(evalops.parse_options.units_enabled)
	// automatic unknown variables
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "unknowns", _("unknowns")) || svar == "unknown")
		SET_BOOL_PV(evalops.parse_options.unknowns_enabled)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "variables", _("variables")) || svar == "var")
		SET_BOOL_PV(evalops.parse_options.variables_enabled)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "abbreviations", _("abbreviations")) || svar == "abbr" || svar == "abbrev")
		SET_BOOL_D(printops.abbreviate_names)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "show ending zeroes", _("show ending zeroes")) || svar == "zeroes")
		SET_BOOL_D(printops.show_ending_zeroes)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "repeating decimals", _("repeating decimals")) || svar == "repdeci")
		SET_BOOL_D(printops.indicate_infinite_series)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "angle unit", _("angle unit")) || svar == "angle")
	{
		int v = -1;
		// angle unit
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "rad", _("rad")) || EQUALS_IGNORECASE_AND_LOCAL(svalue, "radians", _("radians")))
			v = ANGLE_UNIT_RADIANS;
		// angle unit
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "deg", _("deg")) || EQUALS_IGNORECASE_AND_LOCAL(svalue, "degrees", _("degrees")))
			v = ANGLE_UNIT_DEGREES;
		// angle unit
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "gra", _("gra")) || EQUALS_IGNORECASE_AND_LOCAL(svalue, "gradians", _("gradians")))
			v = ANGLE_UNIT_GRADIANS;
		// no angle unit
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "none", _("none")))
			v = ANGLE_UNIT_NONE;
		else if (!empty_value && svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < 0 || v > 3)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			evalops.parse_options.angle_unit = (AngleUnit)v;
			hide_parse_errors = true;
			expression_format_updated(true);
			hide_parse_errors = false;
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "caret as xor", _("caret as xor")) || equalsIgnoreCase(svar, "xor^"))
		SET_BOOL_PT(caret_as_xor)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "parsing mode", _("parsing mode")) || svar == "parse" || svar == "syntax")
	{
		int v = -1;
		// parsing mode
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "adaptive", _("adaptive")))
			v = PARSING_MODE_ADAPTIVE;
		// parsing mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "implicit first", _("implicit first")))
			v = PARSING_MODE_IMPLICIT_MULTIPLICATION_FIRST;
		// parsing mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "conventional", _("conventional")))
			v = PARSING_MODE_CONVENTIONAL;
		// chain calculation mode (parsing mode)
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "chain", _("chain")))
			v = PARSING_MODE_CHAIN;
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "rpn", _("rpn")))
			v = PARSING_MODE_RPN;
		else if (!empty_value && svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < PARSING_MODE_ADAPTIVE || v > PARSING_MODE_RPN)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			evalops.parse_options.parsing_mode = (ParsingMode)v;
			if (evalops.parse_options.parsing_mode == PARSING_MODE_CONVENTIONAL || evalops.parse_options.parsing_mode == PARSING_MODE_IMPLICIT_MULTIPLICATION_FIRST)
				implicit_question_asked = true;
			expression_format_updated(true);
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "update exchange rates", _("update exchange rates")) || svar == "upxrates")
	{
		// exchange rates updates
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "never", _("never")))
		{
			auto_update_exchange_rates = 0;
			// exchange rates updates
		}
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "ask", _("ask")))
		{
			auto_update_exchange_rates = -1;
		}
		else
		{
			int v = s2i(svalue);
			if (empty_value)
				v = 7;
			if (v < 0)
				auto_update_exchange_rates = -1;
			else
				auto_update_exchange_rates = v;
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "multiplication sign", _("multiplication sign")) || svar == "mulsign")
	{
		int v = -1;
		if (svalue == SIGN_MULTIDOT || svalue == ".")
			v = MULTIPLICATION_SIGN_DOT;
		else if (svalue == SIGN_MIDDLEDOT)
			v = MULTIPLICATION_SIGN_ALTDOT;
		else if (svalue == SIGN_MULTIPLICATION || svalue == "x")
			v = MULTIPLICATION_SIGN_X;
		else if (svalue == "*")
			v = MULTIPLICATION_SIGN_ASTERISK;
		else if (!empty_value && svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < MULTIPLICATION_SIGN_ASTERISK || v > MULTIPLICATION_SIGN_ALTDOT)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			printops.multiplication_sign = (MultiplicationSign)v;
			result_display_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "division sign", _("division sign")) || svar == "divsign")
	{
		int v = -1;
		if (svalue == SIGN_DIVISION_SLASH)
			v = DIVISION_SIGN_DIVISION_SLASH;
		else if (svalue == SIGN_DIVISION)
			v = DIVISION_SIGN_DIVISION;
		else if (svalue == "/")
			v = DIVISION_SIGN_SLASH;
		else if (!empty_value && svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < 0 || v > 2)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			printops.division_sign = (DivisionSign)v;
			result_display_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "approximation", _("approximation")) || svar == "appr" || svar == "approx")
	{
		int v = -1;
		// approximation mode
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "exact", _("exact")))
			v = APPROXIMATION_EXACT;
		// automatic
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "auto", _("auto")))
			v = -1;
		// approximation mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "dual", _("dual")))
			v = APPROXIMATION_APPROXIMATE + 1;
		// approximation mode
		else if (empty_value || EQUALS_IGNORECASE_AND_LOCAL(svalue, "try exact", _("try exact")) || svalue == "try")
			v = APPROXIMATION_TRY_EXACT;
		// approximation mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "approximate", _("approximate")) || svalue == "approx")
			v = APPROXIMATION_APPROXIMATE;
		else if (svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v > APPROXIMATION_APPROXIMATE + 1)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			if (v < 0)
			{
				evalops.approximation = APPROXIMATION_TRY_EXACT;
				dual_approximation = -1;
			}
			else if (v == APPROXIMATION_APPROXIMATE + 1)
			{
				evalops.approximation = APPROXIMATION_TRY_EXACT;
				dual_approximation = 1;
			}
			else
			{
				evalops.approximation = (ApproximationMode)v;
				dual_approximation = 0;
			}
			expression_calculation_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "interval calculation", _("interval calculation")) || svar == "ic" || EQUALS_IGNORECASE_AND_LOCAL(svar, "uncertainty propagation", _("uncertainty propagation")) || svar == "up")
	{
		int v = -1;
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "variance formula", _("variance formula")) || EQUALS_IGNORECASE_AND_LOCAL(svalue, "variance", _("variance")))
			v = INTERVAL_CALCULATION_VARIANCE_FORMULA;
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "interval arithmetic", _("interval arithmetic")) || svalue == "iv")
			v = INTERVAL_CALCULATION_INTERVAL_ARITHMETIC;
		else if (!empty_value && svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < INTERVAL_CALCULATION_NONE || v > INTERVAL_CALCULATION_SIMPLE_INTERVAL_ARITHMETIC)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			evalops.interval_calculation = (IntervalCalculation)v;
			expression_calculation_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "autoconversion", _("autoconversion")) || svar == "conv")
	{
		int v = -1;
		MixedUnitsConversion muc = MIXED_UNITS_CONVERSION_DEFAULT;
		// no unit conversion
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "none", _("none")))
		{
			v = POST_CONVERSION_NONE;
			muc = MIXED_UNITS_CONVERSION_NONE;
		}
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "best", _("best")))
			v = POST_CONVERSION_OPTIMAL_SI;
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "optimalsi", _("optimalsi")) || svalue == "si")
			v = POST_CONVERSION_OPTIMAL_SI;
		// optimal units
		else if (empty_value || EQUALS_IGNORECASE_AND_LOCAL(svalue, "optimal", _("optimal")))
			v = POST_CONVERSION_OPTIMAL;
		// base units
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "base", _c("units", "base")))
			v = POST_CONVERSION_BASE;
		// mixed units
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "mixed", _c("units", "mixed")))
			v = POST_CONVERSION_OPTIMAL + 1;
		else if (svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
			if (v == 1)
				v = 3;
			else if (v == 3)
				v = 1;
		}
		if (v == POST_CONVERSION_OPTIMAL + 1)
		{
			v = POST_CONVERSION_NONE;
			muc = MIXED_UNITS_CONVERSION_DEFAULT;
		}
		else if (v == 0)
		{
			v = POST_CONVERSION_NONE;
			muc = MIXED_UNITS_CONVERSION_NONE;
		}
		if (v < 0 || v > POST_CONVERSION_OPTIMAL)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			evalops.auto_post_conversion = (AutoPostConversion)v;
			evalops.mixed_units_conversion = muc;
			expression_calculation_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "currency conversion", _("currency conversion")) || svar == "curconv")
		SET_BOOL_E(evalops.local_currency_conversion)
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "algebra mode", _("algebra mode")) || svar == "alg")
	{
		int v = -1;
		// algebra mode
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "none", _("none")))
			v = STRUCTURING_NONE;
		// algebra mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "simplify", _("simplify")) || EQUALS_IGNORECASE_AND_LOCAL(svalue, "expand", _("expand")))
			v = STRUCTURING_SIMPLIFY;
		// algebra mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "factorize", _("factorize")) || svalue == "factor")
			v = STRUCTURING_FACTORIZE;
		else if (!empty_value && svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < 0 || v > STRUCTURING_FACTORIZE)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			evalops.structuring = (StructuringMode)v;
			printops.allow_factorization = (evalops.structuring == STRUCTURING_FACTORIZE);
			expression_calculation_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "exact", _("exact")))
	{
		int v = s2b(svalue);
		if (v < 0)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else if (v > 0)
		{
			evalops.approximation = APPROXIMATION_EXACT;
			expression_calculation_updated();
		}
		else
		{
			evalops.approximation = APPROXIMATION_TRY_EXACT;
			expression_calculation_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "ignore locale", _("ignore locale")))
	{
		int v = s2b(svalue);
		if (v < 0)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else if (v != ignore_locale)
		{
			if (v > 0)
			{
				ignore_locale = true;
			}
			else
			{
				ignore_locale = false;
			}
			PUTS_UNICODE("Please restart the program for the change to take effect.");
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "save mode", _("save mode")))
	{
		int v = s2b(svalue);
		if (v < 0)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else if (v > 0)
		{
			// save_mode_on_exit = true;
		}
		else
		{
			// save_mode_on_exit = false;
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "clear history", _("clear history")) || equalsIgnoreCase(svar, "save_history"))
	{
		int v = s2b(svalue);
		if (v >= 0 && equalsIgnoreCase(svar, "save_history"))
			v = !v;
		if (v < 0)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else if (v > 0)
		{
			clear_history_on_exit = true;
		}
		else
		{
			clear_history_on_exit = false;
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "save definitions", _("save definitions")) || svar == "save defs")
	{
		int v = s2b(svalue);
		if (v < 0)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else if (v > 0)
		{
			save_defs_on_exit = true;
		}
		else
		{
			save_defs_on_exit = false;
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "scientific notation", _("scientific notation")) || svar == "exp mode" || svar == "exp")
	{
		int v = -1;
		bool valid = true;
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "off", _("off")))
			v = EXP_NONE;
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "auto", _("auto")))
			v = EXP_PRECISION;
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "pure", _("pure")))
			v = EXP_PURE;
		else if (empty_value || EQUALS_IGNORECASE_AND_LOCAL(svalue, "scientific", _("scientific")))
			v = EXP_SCIENTIFIC;
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "engineering", _("engineering")))
			v = EXP_BASE_3;
		else if (svalue.find_first_not_of(SPACES NUMBERS MINUS) == string::npos)
			v = s2i(svalue);
		else
			valid = false;
		if (valid)
		{
			printops.min_exp = v;
			result_format_updated();
		}
		else
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "precision", _("precision")) || svar == "prec")
	{
		long int v = 0;
		if (!empty_value && svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
			v = s2i(svalue);
		if (v < 1)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else if (v != CALCULATOR->getPrecision())
		{
			CALCULATOR->setPrecision(v > INT_MAX ? INT_MAX : (int)v);
			if (CALCULATOR->getPrecision() != v)
			{
				size_t l = i2s(CALCULATOR->getPrecision()).length() + strlen(_("Maximum precision %i set."));
				char *cstr = (char *)malloc(sizeof(char) * (l + 1));
				snprintf(cstr, l, _("Maximum precision %i set."), CALCULATOR->getPrecision());
				PUTS_UNICODE(cstr);
				free(cstr);
			}
			expression_calculation_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "interval display", _("interval display")) || svar == "ivdisp")
	{
		int v = -1;
		// interval display mode
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "adaptive", _("adaptive")))
			v = 0;
		// interval display mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "significant", _("significant")))
			v = INTERVAL_DISPLAY_SIGNIFICANT_DIGITS + 1;
		// interval display mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "interval", _("interval")))
			v = INTERVAL_DISPLAY_INTERVAL + 1;
		else if (empty_value || EQUALS_IGNORECASE_AND_LOCAL(svalue, "plusminus", _("plusminus")))
			v = INTERVAL_DISPLAY_PLUSMINUS + 1;
		// interval display mode: midpoint number in range
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "midpoint", _("midpoint")))
			v = INTERVAL_DISPLAY_MIDPOINT + 1;
		// interval display mode: upper number in range
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "upper", _("upper")))
			v = INTERVAL_DISPLAY_UPPER + 1;
		// interval display mode: lower number in range
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "lower", _("lower")))
			v = INTERVAL_DISPLAY_LOWER + 1;
		else if (svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v == 0)
		{
			adaptive_interval_display = true;
			printops.interval_display = INTERVAL_DISPLAY_SIGNIFICANT_DIGITS;
			result_format_updated();
		}
		else
		{
			v--;
			if (v < INTERVAL_DISPLAY_SIGNIFICANT_DIGITS || v > INTERVAL_DISPLAY_UPPER)
			{
				success = false;
				PUTS_UNICODE(_("Illegal value."));
			}
			else
			{
				adaptive_interval_display = false;
				printops.interval_display = (IntervalDisplay)v;
				result_format_updated();
			}
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "interval arithmetic", _("interval arithmetic")) || svar == "ia" || svar == "interval")
	{
		bool b = CALCULATOR->usesIntervalArithmetic();
		SET_BOOL(b)
		if (b != CALCULATOR->usesIntervalArithmetic())
		{
			CALCULATOR->useIntervalArithmetic(b);
			expression_calculation_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "variable units", _("variable units")) || svar == "varunits")
	{
		bool b = CALCULATOR->variableUnitsEnabled();
		SET_BOOL(b)
		if (b != CALCULATOR->variableUnitsEnabled())
		{
			CALCULATOR->setVariableUnitsEnabled(b);
			expression_calculation_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "max decimals", _("max decimals")) || svar == "maxdeci")
	{
		int v = -1;
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "off", _("off")))
			v = -1;
		else if (!empty_value && svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
			v = s2i(svalue);
		if (v < 0)
		{
			printops.use_max_decimals = false;
			result_format_updated();
		}
		else
		{
			printops.max_decimals = v;
			printops.use_max_decimals = true;
			result_format_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "min decimals", _("min decimals")) || svar == "mindeci")
	{
		int v = -1;
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "off", _("off")))
			v = -1;
		else if (!empty_value && svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
			v = s2i(svalue);
		if (v < 0)
		{
			printops.min_decimals = 0;
			printops.use_min_decimals = false;
			result_format_updated();
		}
		else
		{
			printops.min_decimals = v;
			printops.use_min_decimals = true;
			result_format_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "fractions", _("fractions")) || svar == "fr")
	{
		int v = -1;
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "off", _("off")))
			v = FRACTION_DECIMAL;
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "auto", _("auto")))
			v = -1;
		// fraction mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "exact", _("exact")))
			v = FRACTION_DECIMAL_EXACT;
		else if (empty_value || EQUALS_IGNORECASE_AND_LOCAL(svalue, "on", _("on")))
			v = FRACTION_FRACTIONAL;
		// fraction mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "combined", _("combined")) || EQUALS_IGNORECASE_AND_LOCAL(svalue, "mixed", _("mixed")))
			v = FRACTION_COMBINED;
		// fraction mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "long", _("long")))
			v = FRACTION_COMBINED + 1;
		// fraction mode
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "dual", _("dual")))
			v = FRACTION_COMBINED + 2;
		else if (svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v > FRACTION_COMBINED + 2)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			printops.restrict_fraction_length = (v == FRACTION_FRACTIONAL || v == FRACTION_COMBINED);
			if (v < 0)
				dual_fraction = -1;
			else if (v == FRACTION_COMBINED + 2)
				dual_fraction = 1;
			else
				dual_fraction = 0;
			if (v == FRACTION_COMBINED + 1)
				v = FRACTION_FRACTIONAL;
			else if (v < 0 || v == FRACTION_COMBINED + 2)
				v = FRACTION_DECIMAL;
			printops.number_fraction_format = (NumberFractionFormat)v;
			result_format_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "complex form", _("complex form")) || svar == "cplxform")
	{
		int v = -1;
		// complex form
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "rectangular", _("rectangular")) || EQUALS_IGNORECASE_AND_LOCAL(svalue, "cartesian", _("cartesian")) || svalue == "rect")
			v = COMPLEX_NUMBER_FORM_RECTANGULAR;
		// complex form
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "exponential", _("exponential")) || svalue == "exp")
			v = COMPLEX_NUMBER_FORM_EXPONENTIAL;
		// complex form
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "polar", _("polar")))
			v = COMPLEX_NUMBER_FORM_POLAR;
		// complex form
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "angle", _("angle")) || EQUALS_IGNORECASE_AND_LOCAL(svalue, "phasor", _("phasor")))
			v = COMPLEX_NUMBER_FORM_CIS + 1;
		// complex form
		else if (svar == "cis")
			v = COMPLEX_NUMBER_FORM_CIS;
		else if (!empty_value && svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < 0 || v > 4)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			complex_angle_form = (v > 3);
			if (v == 4)
				v--;
			evalops.complex_number_form = (ComplexNumberForm)v;
			expression_calculation_updated();
		}
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "read precision", _("read precision")) || svar == "readprec")
	{
		int v = -1;
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "off", _("off")))
			v = DONT_READ_PRECISION;
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "always", _("always")))
			v = ALWAYS_READ_PRECISION;
		else if (empty_value || EQUALS_IGNORECASE_AND_LOCAL(svalue, "when decimals", _("when decimals")) || EQUALS_IGNORECASE_AND_LOCAL(svalue, "on", _("on")))
			v = READ_PRECISION_WHEN_DECIMALS;
		else if (svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < 0 || v > 2)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else
		{
			evalops.parse_options.read_precision = (ReadPrecisionMode)v;
			expression_format_updated(true);
		}
#ifndef _WIN32
	}
	else if (EQUALS_IGNORECASE_AND_LOCAL(svar, "sigint action", _("sigint action")) || svar == "sigint")
	{
		int v = -1;
		if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "exit", _("exit")))
			v = 1;
		// kill process
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "kill", _("kill")))
			v = 0;
		// interupt process
		else if (EQUALS_IGNORECASE_AND_LOCAL(svalue, "interrupt", _("interrupt")))
			v = 2;
		else if (svalue.find_first_not_of(SPACES NUMBERS) == string::npos)
		{
			v = s2i(svalue);
		}
		if (v < 0 || v > 2)
		{
			success = false;
			PUTS_UNICODE(_("Illegal value."));
		}
		else if (v != sigint_action)
		{
			if (interactive_mode)
			{
				if (sigint_action == 0)
					signal(SIGINT, sigint_handler);
				else if (v == 0)
					signal(SIGINT, SIG_DFL);
			}
			sigint_action = v;
		}
#endif
	}
	else
	{
		if (i_underscore == string::npos)
		{
			if (index != string::npos)
			{
				if ((index = svar.find_last_of(SPACES)) != string::npos)
				{
					svar = svar.substr(0, index);
					remove_blank_ends(svar);
					svalue = str.substr(index + 1);
					remove_blank_ends(svalue);
					gsub("_", " ", svar);
					gsub(SIGN_MINUS, "-", svalue);
					goto set_option_place;
				}
			}
			if (!empty_value && !svalue.empty())
			{
				svar += " ";
				svar += svalue;
				svalue = "1";
				empty_value = true;
				goto set_option_place;
			}
		}
		success = false;
		PUTS_UNICODE(_("Unrecognized option."));
	}
	return success;
}
