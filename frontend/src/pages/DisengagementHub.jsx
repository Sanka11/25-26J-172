import { Link } from "react-router-dom";
import { 
  Brain, 
  History, 
  Cpu, 
  BarChart3, 
  ArrowRight,
  Network,
  Activity
} from "lucide-react";

export default function DisengagementHub() {
  const gruItems = [
    {
      to: "/gru/batch",
      title: "Run GRU Batch",
      description: "Execute Gated Recurrent Unit model batch processing",
      icon: Brain,
      color: "from-blue-600 to-blue-700",
      hoverColor: "from-blue-700 to-blue-800",
      borderColor: "border-blue-200",
      bgLight: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      to: "/gru/risk-history",
      title: "GRU Risks History",
      description: "View all Gated Recurrent Unit risks and analyses",
      icon: BarChart3,
      color: "from-indigo-600 to-indigo-700",
      hoverColor: "from-indigo-700 to-indigo-800",
      borderColor: "border-indigo-200",
      bgLight: "bg-indigo-50",
      iconColor: "text-indigo-600"
    }
  ];

  const rlItems = [
    {
      to: "/rl/batch",
      title: "Run RL Batch",
      description: "Execute Reinforcement Learning model batch processing",
      icon: Network,
      color: "from-green-600 to-green-700",
      hoverColor: "from-green-700 to-green-800",
      borderColor: "border-green-200",
      bgLight: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      to: "/rl/intervention-history",
      title: "RL History",
      description: "View Reinforcement Learning model execution history",
      icon: History,
      color: "from-purple-600 to-purple-700",
      hoverColor: "from-purple-700 to-purple-800",
      borderColor: "border-purple-200",
      bgLight: "bg-purple-50",
      iconColor: "text-purple-600"
    }
  ];

  const predictionItems = [
    {
      to: "/gru/student-behaviour",
      title: "Student Behavior Prediction",
      description: "Predict student disengagement using combined GRU & RL models",
      icon: Activity,
      color: "from-orange-600 to-orange-700",
      hoverColor: "from-orange-700 to-orange-800",
      borderColor: "border-orange-200",
      bgLight: "bg-orange-50",
      iconColor: "text-orange-600"
    }
  ];

  const renderSection = (title, items, bgColor) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <span className={`w-1 h-6 ${bgColor} rounded-full`}></span>
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={index}
              to={item.to}
              className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              {/* Content */}
              <div className="relative p-6">
                <div className="flex items-start gap-4">
                  {/* Icon Container */}
                  <div className={`p-3 ${item.bgLight} rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${item.iconColor}`} />
                  </div>
                  
                  {/* Text Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      {item.description}
                    </p>
                    
                    {/* Action Button */}
                    <div className={`inline-flex items-center gap-2 ${item.iconColor} font-medium text-sm group-hover:gap-3 transition-all duration-300`}>
                      <span>Access Module</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Border Accent */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Disengagement Control Center
            </h1>
          </div>
          <p className="text-slate-600 ml-14">
            Manage and monitor GRU, RL models and predictions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Model Prediction Section */}
        {renderSection("Model Prediction", predictionItems, "bg-orange-600")}
        
        {/* GRU Section */}
        {renderSection("GRU Models", gruItems, "bg-blue-600")}
        
        {/* RL Section */}
        {renderSection("RL Models", rlItems, "bg-green-600")}

        {/* Quick Actions Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Select a module to begin operation
            </p>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-medium">
                Combined: GRU + RL
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                GRU: Gated Recurrent Unit
              </span>
              <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                RL: Reinforcement Learning
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}