#include <emscripten/bind.h>
#include <libqalculate/Calculator.h>
#include <libqalculate/Variable.h>

using namespace emscripten;

Calculator calc;
EvaluationOptions evalops;
PrintOptions printops;

#include "settings.h"

struct Calculation
{
	std::string input;
	std::string output;
	std::string messages;
};

#define OPTIONS_NO_UNIT 1
#define OPTIONS_DECIMAL_POINT 2

bool usingDecimalPoint = false;

Calculation calculate(std::string calculation, int timeout = 500, int optionFlags = 0)
{
	calculator->clearMessages();

	bool useDecimalPoint = optionFlags & OPTIONS_DECIMAL_POINT;
	if (usingDecimalPoint != useDecimalPoint)
	{
		usingDecimalPoint = useDecimalPoint;
		if (usingDecimalPoint)
			calc.useDecimalPoint();
		else
			calc.useDecimalComma();
	}

	calculation = calc.unlocalizeExpression(calculation, evalops.parse_options);
	std::string parsed_str;
	bool resultIsComparison;
	printops.use_unit_prefixes = optionFlags & OPTIONS_NO_UNIT ? false : true;
	auto result = calc.calculateAndPrint(calculation, timeout, evalops, printops, AUTOMATIC_FRACTION_AUTO, AUTOMATIC_APPROXIMATION_AUTO, &parsed_str, -1, &resultIsComparison, true, 2, TAG_TYPE_HTML);

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

struct VariableInfo
{
	std::string name;
	std::string description;
	std::string aliases;
};

std::vector<VariableInfo> getVariables()
{
	std::vector<VariableInfo> variables;
	for (auto &variable : calc.variables)
	{
		if (!variable->isKnown() || variable->isHidden())
			continue;

		VariableInfo info;
		info.name = variable->preferredDisplayName(true, true).name;
		info.description = variable->title(false, true);
		auto nameCount = variable->countNames();
		if (nameCount < 1)
		{
			info.aliases = variable->preferredDisplayName(true, true).name;
		}
		else
		{
			for (size_t i = 1; i <= nameCount; i++)
			{
				info.aliases += variable->getName(i).name;
				if (i < nameCount)
					info.aliases += "\t";
			}
		}
		variables.push_back(info);
	}
	return variables;
}

int main()
{
	calc.loadGlobalDefinitions();
	calc.useDecimalComma();
	printops.use_unicode_signs = true;
	printops.interval_display = INTERVAL_DISPLAY_SIGNIFICANT_DIGITS;
	printops.base_display = BASE_DISPLAY_NORMAL;
	printops.digit_grouping = DIGIT_GROUPING_STANDARD;
	printops.indicate_infinite_series = true;
	evalops.parse_options.angle_unit = ANGLE_UNIT_RADIANS;
	evalops.parse_options.unknowns_enabled = false;
	evalops.parse_options.limit_implicit_multiplication = true;
	return 0;
}

std::string info()
{
	return "libqalculate by Hanna Knutsson, compiled by Stephan Troyer";
}

int version()
{
	return 3;
}

EMSCRIPTEN_BINDINGS(Calculator)
{
	function("calculate", &calculate);
	function("info", &info);
	function("version", &version);
	function("getVariables", &getVariables);
	function("set_option", &set_option);
}

EMSCRIPTEN_BINDINGS(calculation)
{
	class_<Calculation>("Calculation")
		.constructor<>()
		.property("input", &Calculation::input)
		.property("output", &Calculation::output)
		.property("messages", &Calculation::messages);
}

EMSCRIPTEN_BINDINGS(variableInfo)
{
	class_<VariableInfo>("VariableInfo")
		.constructor<>()
		.property("name", &VariableInfo::name)
		.property("description", &VariableInfo::description)
		.property("aliases", &VariableInfo::aliases);
	register_vector<VariableInfo>("vector<VariableInfo>");
}
