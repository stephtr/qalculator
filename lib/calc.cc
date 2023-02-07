#include <emscripten/bind.h>
#include <libqalculate/Calculator.h>
#include <libqalculate/Variable.h>

using namespace emscripten;

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
	po.use_unicode_signs = true;
	po.interval_display = INTERVAL_DISPLAY_SIGNIFICANT_DIGITS;
	po.base_display = BASE_DISPLAY_NORMAL;
	po.indicate_infinite_series = true;
	eo.parse_options.angle_unit = ANGLE_UNIT_RADIANS;
	eo.parse_options.unknowns_enabled = false;
	eo.parse_options.limit_implicit_multiplication = true;
	return 0;
}

std::string info()
{
	return "libqalculate by Hanna Knutsson, compiled by Stephan Troyer";
}

EMSCRIPTEN_BINDINGS(Calculator)
{
	function("calculate", &calculate);
	function("info", &info);
	function("getVariables", &getVariables);
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
