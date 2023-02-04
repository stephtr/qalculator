#include <emscripten/bind.h>
#include <libqalculate/Calculator.h>

using namespace emscripten;

void print_dual(const MathStructure &mresult, const std::string &original_expression, const MathStructure &mparse, MathStructure &mexact, std::string &result_str, std::vector<std::string> &results_v, PrintOptions &po, const EvaluationOptions &evalops, AutomaticFractionFormat auto_frac, AutomaticApproximation auto_approx, bool cplx_angle = false, bool *exact_cmp = NULL, bool b_parsed = true, bool format = false, int colorize = 0, int tagtype = TAG_TYPE_HTML, int max_length = -1);

Calculator calc;
EvaluationOptions eo;
PrintOptions po;

struct Calculation
{
	std::string input;
	std::string output;
	std::string messages;
};

Calculation calculate(std::string calculation, int timeout = 500)
{
	calculator->clearMessages();

	calculation = calc.unlocalizeExpression(calculation, eo.parse_options);
	std::string parsed_str;
	bool resultIsComparison;
	auto result = calc.calculateAndPrint(calculation, timeout, eo, po, AUTOMATIC_FRACTION_AUTO, AUTOMATIC_APPROXIMATION_AUTO, &parsed_str, -1, &resultIsComparison, true, 2, TAG_TYPE_HTML);

	Calculation ret;
	ret.input = parsed_str;
	ret.output = result;
	CalculatorMessage *message;
	if ((message = calculator->message()))
	{
		auto msgType = message->type();
		std::string severity = msgType == MESSAGE_INFORMATION ? "Info" : msgType == MESSAGE_WARNING ? "Warning"
																							 : "Error";
		ret.messages += severity + ": " + message->message() + "\n";
	}

	return ret;
}

std::string info()
{
	return "libqalculate by Hanna Knutsson, compiled by Stephan Troyer";
}

int main()
{
	calc.loadGlobalDefinitions();
	calc.useDecimalComma();
	po.use_unicode_signs = true;
	po.interval_display = INTERVAL_DISPLAY_SIGNIFICANT_DIGITS;
	po.base_display = BASE_DISPLAY_NORMAL;
	po.indicate_infinite_series = true;
	eo.parse_options.angle_unit = ANGLE_UNIT_RADIANS;
	eo.parse_options.unknowns_enabled = false;
	eo.parse_options.limit_implicit_multiplication = true;
	return 0;
}

EMSCRIPTEN_BINDINGS(Calculator)
{
	function("calculate", &calculate);
	function("info", &info);
}

EMSCRIPTEN_BINDINGS(calculation)
{
	class_<Calculation>("Calculation")
		.constructor<>()
		.property("input", &Calculation::input)
		.property("output", &Calculation::output)
		.property("messages", &Calculation::messages);
}
